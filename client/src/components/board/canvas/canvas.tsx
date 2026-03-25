"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { CanvasMode, CanvasState, color, layerType, Point, RectangleLayer } from "@/types/canvas";
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
import { Rectangle as RectangleTool } from "../boardTools/rectangle";

const MAX_LAYERS = 500;

export default function Canvas({id, title}: {id: string, title: string}) {
    const [canvasState, setCanvasState] = useState<CanvasState>({ mode: CanvasMode.None });
    const { undo, redo, canUndo, canRedo, saveState, currentState } = useHistory();

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

    // Frontend-only rectangle layers (no websocket persistence yet).
    const [rectangleLayers, setRectangleLayers] = useState<
        Array<{ id: string; layer: RectangleLayer }>
    >([]);
    const [draftRectangleLayer, setDraftRectangleLayer] = useState<
        { id: string; layer: RectangleLayer } | null
    >(null);

    const svgRef = useRef<SVGSVGElement | null>(null);
    const insertingStartRef = useRef<Point | null>(null);
    const rectIdCounterRef = useRef(0);
    const didInitHistoryRef = useRef(false);

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

    // Seed history with an initial empty snapshot so undo returns to "no rectangles".
    useEffect(() => {
        if (didInitHistoryRef.current) return;
        didInitHistoryRef.current = true;
        saveState(JSON.stringify([]));
    }, [saveState]);

    // Apply history snapshots to the current frontend-only rectangle layers.
    useEffect(() => {
        if (currentState === undefined) return;

        try {
            const parsed = JSON.parse(currentState) as Array<{ id: string; layer: RectangleLayer }>;
            if (Array.isArray(parsed)) {
                setRectangleLayers(parsed);
            }
        } catch {
            // If history contains unexpected data, don't crash the UI.
        } finally {
            // Never keep a stale draft while undo/redo changes the canvas.
            insertingStartRef.current = null;
            setDraftRectangleLayer(null);
        }
    }, [currentState]);

    // Keyboard shortcuts for frontend undo/redo.
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            // Avoid interfering with typing.
            const target = e.target as HTMLElement | null;
            const tag = target?.tagName?.toLowerCase();
            const isTypingContext =
                tag === "input" || tag === "textarea" || !!target?.isContentEditable;
            if (isTypingContext) return;

            if (!e.ctrlKey) return;
            if (e.repeat) return;

            if (e.key === "z" || e.key === "Z") {
                e.preventDefault();
                undo();
                return;
            }

            if (e.key === "y" || e.key === "Y") {
                e.preventDefault();
                redo();
                return;
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [undo, redo]);

    // If the user switches tools mid-drag, cancel the current rectangle preview.
    useEffect(() => {
        if (canvasState.mode !== CanvasMode.Inserting || canvasState.layerType !== "Rectangle") {
            insertingStartRef.current = null;
            setDraftRectangleLayer(null);
        }
    }, [canvasState]);

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

    const strokeColor = `rgb(${lastUsedColor.r}, ${lastUsedColor.g}, ${lastUsedColor.b})`;

    const clientToWorld = useCallback(
        (clientX: number, clientY: number) => {
            const bounds = svgRef.current?.getBoundingClientRect();
            const left = bounds?.left ?? 0;
            const top = bounds?.top ?? 0;
            return {
                x: clientX - left - camera.x,
                y: clientY - top - camera.y,
            };
        },
        [camera.x, camera.y]
    );

    const onSvgPointerDown = useCallback(
        (e: React.PointerEvent<SVGSVGElement>) => {
            if (canvasState.mode !== CanvasMode.Inserting || canvasState.layerType !== "Rectangle") return;

            // Begin a drag-to-insert rectangle.
            const start = clientToWorld(e.clientX, e.clientY);
            insertingStartRef.current = start;

            e.currentTarget.setPointerCapture(e.pointerId);

            const draftId = "draft-rectangle";
            const draftLayer: RectangleLayer = {
                type: layerType.Rectangle,
                x: start.x,
                y: start.y,
                width: 0,
                height: 0,
                fill: lastUsedColor,
            };
            setDraftRectangleLayer({ id: draftId, layer: draftLayer });

            e.preventDefault();
        },
        [canvasState, clientToWorld, lastUsedColor]
    );

    const onSvgPointerMove = useCallback(
        (e: React.PointerEvent<SVGSVGElement>) => {
            if (!insertingStartRef.current) return;
            if (canvasState.mode !== CanvasMode.Inserting || canvasState.layerType !== "Rectangle") return;

            const start = insertingStartRef.current;
            const end = clientToWorld(e.clientX, e.clientY);

            const x = Math.min(start.x, end.x);
            const y = Math.min(start.y, end.y);
            const width = Math.abs(end.x - start.x);
            const height = Math.abs(end.y - start.y);

            setDraftRectangleLayer({
                id: "draft-rectangle",
                layer: {
                    type: layerType.Rectangle,
                    x,
                    y,
                    width,
                    height,
                    fill: lastUsedColor,
                },
            });

            e.preventDefault();
        },
        [canvasState, clientToWorld, lastUsedColor]
    );

    const onSvgPointerUp = useCallback(
        (e: React.PointerEvent<SVGSVGElement>) => {
            if (!insertingStartRef.current) return;
            if (canvasState.mode !== CanvasMode.Inserting || canvasState.layerType !== "Rectangle") return;

            const start = insertingStartRef.current;
            const end = clientToWorld(e.clientX, e.clientY);

            const x = Math.min(start.x, end.x);
            const y = Math.min(start.y, end.y);
            const width = Math.abs(end.x - start.x);
            const height = Math.abs(end.y - start.y);

            // Ignore tiny clicks/drags.
            if (width >= 1 && height >= 1) {
                const newId = `rect-${rectIdCounterRef.current++}`;
                if (rectangleLayers.length >= MAX_LAYERS) {
                    insertingStartRef.current = null;
                    setDraftRectangleLayer(null);
                    e.preventDefault();
                    return;
                }

                const nextLayers = [
                    ...rectangleLayers,
                    {
                        id: newId,
                        layer: {
                            type: layerType.Rectangle,
                            x,
                            y,
                            width,
                            height,
                            fill: lastUsedColor,
                        } satisfies RectangleLayer,
                    },
                ];

                setRectangleLayers(nextLayers);
                saveState(JSON.stringify(nextLayers));
            }

            insertingStartRef.current = null;
            setDraftRectangleLayer(null);

            e.preventDefault();
        },
        [canvasState, clientToWorld, lastUsedColor, rectangleLayers, saveState]
    );

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

            <svg
                ref={svgRef}
                className="h-screen w-screen"
                onWheel={onWheel}
                onPointerDown={onSvgPointerDown}
                onPointerMove={onSvgPointerMove}
                onPointerUp={onSvgPointerUp}
            >
                <g style={{transform: `translate(${camera.x}px, ${camera.y}px)`}}>
                    {draftRectangleLayer && (
                        <RectangleTool
                            id={draftRectangleLayer.id}
                            layer={draftRectangleLayer.layer}
                            onPointerDown={() => {}}
                            selectionColor={strokeColor}
                        />
                    )}

                    {rectangleLayers.map(({ id: layerId, layer }) => (
                        <RectangleTool
                            key={layerId}
                            id={layerId}
                            layer={layer}
                            onPointerDown={() => {}}
                            selectionColor={strokeColor}
                        />
                    ))}

                    <CursorPresence cursors={otherCursors} />
                </g>
            </svg>
        </main>
    );
}