"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { CanvasMode, CanvasState, color } from "@/types/canvas";
import { useHistory } from "@/hooks/use-history";
import { connectSocket } from "@/lib/api/websocket-api";

import Info from "../info/info";
import Members from "../members/members";
import Toolbar from "../toolbar/toolbar";
import { CursorPresence } from "../cursor-presence";
import { useAuth } from "@/providers/auth-provider";
import {LayerPreview} from "../layer-preview";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const MAX_LAYERS = 500;

export default function Canvas({id, title}: {id: string, title: string}) {
    const [canvasState, setCanvasState] = useState<CanvasState>({ mode: CanvasMode.None });
    const { undo, redo, canUndo, canRedo } = useHistory();

    const router = useRouter()

    const [camera, setCamera] = useState({x: 0, y: 0});

    const [lastUsedColor, setLastUsedColor] = useState<color>({
        r: 0,
        b: 0,
        g: 0
    });

    const {user} = useAuth();
    
    // State to track other users' cursors
    const [otherCursors, setOtherCursors] = useState<Record<string, {x: number, y: number, name: string}>>({});
    const wsRef = useRef<WebSocket | null>(null);
    const lastSentRef = useRef<number>(0); 

    useEffect(() => {
        let isCancelled = false;
        const setup = async () => {
            try {
                const { socket, error } = await connectSocket(id);
                if (error !== null) {
                    toast({
                        title: "Error",
                        description: error,
                        variant: "destructive",
                    })
                    router.push("/")
                    return;
                }
                if (isCancelled) { socket.close(); return; }
                wsRef.current = socket;

                socket.onmessage = (event: any) => {
                    const data = JSON.parse(event.data);
                    
                    // If we receive a cursor move from someone else
                    if (data.type === "CURSOR_MOVE") {
                        setOtherCursors((prev) => ({
                            ...prev,
                            [data.userId]: data.content // content is {x, y}
                        }));
                    }
                };
            } catch (err) { console.error(err); }
        };
        setup();
        return () => { isCancelled = true; wsRef.current?.close(); };
    }, [id]);

    // THROTTLED MOUSE MOVE
    const onPointerMove = useCallback((e: React.PointerEvent) => {
        const now = Date.now();
        // Only send every 30ms (roughly 33fps) to save the Go backend
        if (now - lastSentRef.current < 30) return;
        lastSentRef.current = now;

        const current = { x: Math.round(e.clientX), y: Math.round(e.clientY), name: user?.name || "AMIE"  };

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: "CURSOR_MOVE",
                content: current
            }));
        }
    }, []);

    const onWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        setCamera((prev) => ({
            x: prev.x - e.deltaX,
            y: prev.y - e.deltaY,
        }));
    }, [])

    return (
        <main 
            className="h-full w-full relative bg-neutral-100 touch-none overflow-hidden"
            onPointerMove={onPointerMove}
        >
            <Info id={id} title={title}/>
            <Members id={id} />
            <Toolbar  
                canvasState={canvasState}
                setCanvasState={setCanvasState}
                undo={undo}
                redo={redo}
                canUndo={canUndo}
                canRedo={canRedo} 
            />

            <svg className="h-screen w-screen" onWheel={onWheel}>
                <g style={{transform: `translate(${camera.x}px, ${camera.y}px)`}}>
                    {/* <LayerPreview 
                        id={id}
                        onLayerPointDown={() => {}}
                        onLayerPointUp={() => {}}
                        selectionColor={lastUsedColor}
                    /> */}
                    <CursorPresence cursors={otherCursors} />
                </g>
            </svg>
        </main>
    );
}