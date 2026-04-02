"use client";

import { Kalam } from "next/font/google";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
// Use the better utility functions here
import { cn, ColorToCss, getContrastingTextColor } from "@/lib/utils"; 
import { NoteLayer } from "@/types/types";
import { useState } from "react";

const font = Kalam({
    subsets: ["latin"],
    weight: ["400"],
});

interface NoteProps {
    id: string;
    layer: NoteLayer;
    onPointerDown: (e: React.PointerEvent, id: string) => void;
    selectionColor?: string;
    onValueChange: (value: string) => void;
}

const calculateFontSize = (width: number, height: number) => {
    const scaleFactor = 0.15;
    return Math.min(96, height * scaleFactor, width * scaleFactor);
}

export default function Note({ id, layer, onPointerDown, selectionColor, onValueChange }: NoteProps) {
    const { x, y, width, height, fill, value } = layer;
    const [isEditing, setIsEditing] = useState(false)

    return (
        <foreignObject 
            x={x}
            y={y}
            width={width}
            height={height}
            onDoubleClick={() => setIsEditing(true)}
            onPointerDown={(e) => onPointerDown(e, id)}
            style={{
                outline: selectionColor ? `1px solid ${selectionColor}` : "none",
                backgroundColor: fill ? ColorToCss(fill) : "#000",
            }}
            className="shadow-md drop-shadow-xl"
        >

            <ContentEditable 
                html={value || "Text"}
                disabled={!isEditing}
                onBlur={() => setIsEditing(false)}
                onChange={(e: ContentEditableEvent) => onValueChange(e.target.value)}
                className={cn(
                    "h-full w-full flex items-center justify-center text-center outline-none",
                    font.className
                )}
                style={{
                    fontSize: calculateFontSize(width, height),
                    color: fill ? getContrastingTextColor(fill) : "#fff",
                    cursor: isEditing ? "text" : "default",
                    userSelect: isEditing ? "auto" : "none",
                }}
            />
        </foreignObject>
    )
}