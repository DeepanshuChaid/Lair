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

import { ColorPicker } from "../color-picker"; // Adjust path as needed
import { color, CanvasState, CanvasMode } from "@/types/canvas";
import { ToolButton } from "../tool-button/tool-button";

interface ToolbarProps {
    canvasState: CanvasState;
    setCanvasState: (state: CanvasState) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    lastUsedColor: color;
    onChangeColor: (color: color) => void;
};

export default function Toolbar ({
    canvasState,
    setCanvasState,
    undo,
    redo,
    canUndo,
    canRedo,
    lastUsedColor,
    onChangeColor,
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
                    isActive={canvasState.mode === CanvasMode.Inserting && canvasState.layerType === "Text"} // Logic depends on how you handle 'Inserting'
                    onClick={() => setCanvasState({ 
                        mode: CanvasMode.Inserting, 
                        layerType: "Text" // Assuming your Inserting state takes a layerType
                    } as any)} 
                />
                <ToolButton 
                    label="Sticky note"
                    icon={StickyNote}
                    isActive={canvasState.mode === CanvasMode.Inserting && canvasState.layerType === "Note"}
                    onClick={() => setCanvasState({ 
                        mode: CanvasMode.Inserting, 
                        layerType: "Note" 
                    } as any)}
                />
                <ToolButton 
                    label="Rectangle"
                    icon={Square}
                    isActive={canvasState.mode === CanvasMode.Inserting && canvasState.layerType === "Rectangle"}
                    onClick={() => setCanvasState({ 
                        mode: CanvasMode.Inserting, 
                        layerType: "Rectangle" 
                    } as any)}
                />
                <ToolButton 
                    label="Circle"
                    icon={Circle}
                    isActive={canvasState.mode === CanvasMode.Inserting && canvasState.layerType === "Ellipse"}
                    onClick={() => setCanvasState({ 
                        mode: CanvasMode.Inserting, 
                        layerType: "Ellipse" 
                    } as any)}
                />
                <ToolButton 
                    label="Pencil"
                    icon={Pencil}
                    isActive={canvasState.mode === CanvasMode.Pencil}
                    onClick={() => setCanvasState({ mode: CanvasMode.Pencil })}
                />
            </div>

            {/* COLOR PICKER */}
            <div className="flex flex-col items-center gap-y-4 border-t border-neutral-200 pt-4">
                <ColorPicker 
                    lastUsedColor={lastUsedColor} 
                    onChange={onChangeColor} 
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