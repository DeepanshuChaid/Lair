"use client";

import Info from "../info/info";
import Members from "../members/members";
import Toolbar from "../toolbar/toolbar";


export default function Canvas({id, title}: {id: string, title: string}) {
    return (
        <main className="h-full w-full relative bg-neutral-100 touch-none">
            <Info id={id} title={title}/>
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