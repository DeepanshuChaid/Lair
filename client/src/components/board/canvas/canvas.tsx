"use client";

import Info from "../info/info";
import Members from "../members/members";
import Toolbar from "../toolbar/toolbar";
import { useState } from "react";
import { CanvasMode, CanvasState } from "@/types/canvas";
import { useHistory } from "@/hooks/use-history";
import {CursorPresence} from "../cursor-presence";


export default function Canvas({id, title}: {id: string, title: string}) {
    const [canvasState, setCanvasState] = useState<CanvasState>({ mode: CanvasMode.None });
    
    // 1. Initialize our custom history hook
    const { undo, redo, canUndo, canRedo, saveState } = useHistory();

    // 2. This is where you'll send data to your Go backend later
    const handleUndo = () => {
        undo();
        // socket.send(JSON.stringify({ type: "UNDO", roomId: id }));
    };

    const handleRedo = () => {
        redo();
        // socket.send(JSON.stringify({ type: "REDO", roomId: id }));
    };

    return (
        <main className="h-full w-full relative bg-neutral-100 touch-none">
            <Info id={id} title={title}/>
            <Members id={id} />
            <Toolbar  
                canvasState={canvasState}
                setCanvasState={setCanvasState}
                undo={handleUndo}
                redo={handleRedo}
                canUndo={canUndo}
                canRedo={canRedo} 
            />

            <svg
                className="bg-black h-screen w-screen"
            >
                <g>
                    <CursorPresence />
                </g>
            </svg>
            
        </main>
    )
}