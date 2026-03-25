"use client"

import { Skeleton } from "@/components/ui/skeleton";
import { ToolButton } from "../tool-button/tool-button";
import { MousePointer, Pencil, Eraser, Circle, Type, Undo, Redo, StickyNote } from "lucide-react";
import { CanvasMode } from "@/types/canvas";


interface ToolbarProps {
    canvasState: CanvasMode;
    setCanvasState: (newState: CanvasMode) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

export default function Toolbar({
    canvasState,
    setCanvasState,
    undo,
    redo,
    canUndo,
    canRedo,
}: ToolbarProps) {
    return (
        <div className="absolute top-[50%] -translate-y-[50%] left-2 flex flex-col gap-y-4">
            <div className="bg-white rounded-md p-1.5 flex gap-y-1 flex-col items-center shadow-md">
                <ToolButton
                    label="Cursor"
                    icon={MousePointer}
                    isActive={canvasState?.mode === "Cursor"}
                    onClick={() => setCanvasState({ ...canvasState, mode: "Cursor" })}
                />
                <ToolButton 
                    label="Pencil"
                    icon={Pencil}
                    isActive={canvasState?.mode === "Pencil"}
                    onClick={() => setCanvasState({ ...canvasState, mode: "Pencil" })}
                />
                <ToolButton 
                    label="Eraser"
                    icon={Eraser}
                    isActive={canvasState?.mode === "Cursor" && canvasState?.tool === "Eraser"}
                    // Eraser tool is not implemented yet; keep Cursor active for now.
                    onClick={() => setCanvasState({ ...canvasState, mode: "Cursor" })}
                />
                <ToolButton 
                    label="Circle"
                    icon={Circle}
                    isActive={canvasState?.mode === "Circle"}
                    onClick={() => setCanvasState({ ...canvasState, mode: "Circle" })}
                />
                <ToolButton 
                    label="Sticky Note"
                    icon={StickyNote}
                    isActive={canvasState?.mode === "StickyNote"}
                    onClick={() => setCanvasState({ ...canvasState, mode: "StickyNote" })}
                />
                <ToolButton 
                    label="Text"
                    icon={Type}
                    isActive={canvasState?.mode === "Text"}
                    onClick={() => setCanvasState({ ...canvasState, mode: "Text" })}
                />
            </div>
            <div className="bg-white rounded-md p-1.5 flex gap-y-1 flex-col items-center shadow-md">
                <ToolButton 
                    label="Undo"
                    icon={Undo}
                    onClick={undo}
                    isDisabled={!canUndo}
                />
                <ToolButton 
                    label="Redo"
                    icon={Redo}
                    onClick={redo}  
                    isDisabled={!canRedo}
                />
            </div>
        </div>
    )
}

export function ToolbarSkeleton() {
    return (
        <div className="absolute top-[50%] -translate-y-[50%] left-2 flex flex-col gap-y-4 bg-white h-[360px] w-[52px] shadow-md rounded-md">
        </div>
    )
}