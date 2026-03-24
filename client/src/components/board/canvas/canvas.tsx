"use client";

import Info from "../info/info";
import Members from "../members/members";
import Toolbar from "../toolbar/toolbar";


export default function Canvas() {
    return (
        <main className="h-full w-full relative bg-neutral-100 touch-none">
            <Info />
            <Members />
            <Toolbar  
                canvasState={{}}
                setCanvasState={() => {}}
                undo={() => {}}
                redo={() => {}}
                canUndo={false}
                canRedo={false} 
            />
        </main>
    )
}