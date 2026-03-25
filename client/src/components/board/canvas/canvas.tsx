"use client";

import Info from "../info/info";
import Members from "../members/members";
import Toolbar from "../toolbar/toolbar";
import { useState } from "react";
import { CanvasMode } from "@/types/canvas";


export default function Canvas({id, title}: {id: string, title: string}) {
    const [canvasState, setCanvasState] = useState<CanvasMode>(CanvasMode.None)

    const [history, setHistory] = useState<string>("")

    return (
        <main className="h-full w-full relative bg-neutral-100 touch-none">
            <Info id={id} title={title}/>
            <Members id={id} />
            <Toolbar  
                canvasState={canvasState}
                setCanvasState={setCanvasState}
                undo={() => {}}
                redo={() => {}}
                canUndo={false}
                canRedo={false} 
            />
        </main>
    )
}