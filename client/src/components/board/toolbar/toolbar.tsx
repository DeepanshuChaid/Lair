"use client"

import { ToolButton } from "../tool-button/tool-button";
import { MousePointer, Pencil, Eraser, Square, Circle, Type, Undo, Redo, Trash, Text } from "lucide-react";

export default function Toolbar () {
    return (
        <div className="absolute top-[50%] -translate-y-[50%] left-2 flex flex-col gap-y-4">
            <div className="bg-white rounded-md p-1.5 flex gap-y-1 flex-col items-center shadow-md">
                <ToolButton
                    label="Cursor"
                    icon={MousePointer}
                    onClick={() => {}}
                />
                <ToolButton 
                    label="Pencil"
                    icon={Pencil}
                    onClick={() => {}}
                />
                <ToolButton 
                    label="Eraser"
                    icon={Eraser}
                    onClick={() => {}}
                />
                <ToolButton 
                    label="Circle"
                    icon={Circle}
                    onClick={() => {}}
                />
                <ToolButton 
                    label="Text"
                    icon={Text}
                    onClick={() => {}}
                />
                <ToolButton 
                    label="Undo"
                    icon={Undo}
                    onClick={() => {}}
                />
                <ToolButton 
                    label="Redo"
                    icon={Redo}
                    onClick={() => {}}
                />
                <ToolButton 
                    label="Clear"
                    icon={Trash}
                    onClick={() => {}}
                />
            </div>
        </div>
    )
}