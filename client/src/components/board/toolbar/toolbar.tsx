"use client";

import { 
    MousePointer, 
    Pencil, 
    Eraser, 
    Circle, 
    Type, 
    Undo, 
    Redo, 
    StickyNote, 
    Square 
} from "lucide-react";

import { CanvasMode, CanvasState } from "@/types/canvas";
import { ToolButton } from "../tool-button/tool-button";

interface ToolbarProps {
    canvasState: CanvasState;
    setCanvasState: (newState: CanvasState) => void;
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
                    label="Select"
                    icon={MousePointer}
                    isActive={
                        canvasState.mode === CanvasMode.None ||
                        canvasState.mode === CanvasMode.Translating ||
                        canvasState.mode === CanvasMode.SelectionNet ||
                        canvasState.mode === CanvasMode.Pressing ||
                        canvasState.mode === CanvasMode.Resizing 
                    }
                    onClick={() => setCanvasState({ mode: CanvasMode.None })}
                />
                <ToolButton 
                    label="Text"
                    icon={Type}
                    isActive={canvasState.mode === CanvasMode.Inserting} // Logic depends on how you handle 'Inserting'
                    onClick={() => setCanvasState({ 
                        mode: CanvasMode.Inserting, 
                        layerType: "Text" // Assuming your Inserting state takes a layerType
                    } as any)} 
                />
                <ToolButton 
                    label="Sticky note"
                    icon={StickyNote}
                    isActive={canvasState.mode === CanvasMode.Inserting}
                    onClick={() => setCanvasState({ 
                        mode: CanvasMode.Inserting, 
                        layerType: "Note" 
                    } as any)}
                />
                <ToolButton 
                    label="Rectangle"
                    icon={Square}
                    isActive={canvasState.mode === CanvasMode.Inserting}
                    onClick={() => setCanvasState({ 
                        mode: CanvasMode.Inserting, 
                        layerType: "Rectangle" 
                    } as any)}
                />
                <ToolButton 
                    label="Circle"
                    icon={Circle}
                    isActive={canvasState.mode === CanvasMode.Inserting}
                    onClick={() => setCanvasState({ 
                        mode: CanvasMode.Inserting, 
                        layerType: "Circle" 
                    } as any)}
                />
                <ToolButton 
                    label="Pencil"
                    icon={Pencil}
                    isActive={canvasState.mode === CanvasMode.Pencil}
                    onClick={() => setCanvasState({ mode: CanvasMode.Pencil })}
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
    );
}

export function ToolbarSkeleton() {
    return (
        <div className="absolute top-[50%] -translate-y-[50%] left-2 flex flex-col gap-y-4 bg-white h-[360px] w-[52px] shadow-md rounded-md" />
    );
}