"use client";

import { Kalam } from "next/font/google";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
// Use the better utility functions here
import { cn, ColorToCss, getContrastingTextColor } from "@/lib/utils"; 
import { NoteLayer } from "@/types/canvas";

const font = Kalam({
    subsets: ["latin"],
    weight: ["400"],
});

interface NoteProps {
    id: string;
    layer: NoteLayer;
    onPointerDown: (e: React.PointerEvent, id: string) => void;
    selectionColor?: string;
    onValueChange: (value: string) => void; // Keep this for your custom socket logic
}

const calculateFontSize = (width: number, height: number) => {
    const scaleFactor = 0.15;
    return Math.min(96, height * scaleFactor, width * scaleFactor);
};

export const Note = ({ id, layer, onPointerDown, selectionColor, onValueChange }: NoteProps) => {
    const { x, y, width, height, fill, value } = layer;

    return (
        <foreignObject
            x={x}
            y={y}
            width={width}
            height={height}
            onPointerDown={(e) => onPointerDown(e, id)}
            style={{
                // Smoother 1px outline often looks cleaner than 2px
                outline: selectionColor ? `1px solid ${selectionColor}` : "none",
                backgroundColor: fill ? ColorToCss(fill) : "#000",
            }}
            className="shadow-md drop-shadow-xl"
        >
            <ContentEditable
                html={value || "Text"} 
                onChange={(e: ContentEditableEvent) => onValueChange(e.target.value)}
                className={cn(
                    "h-full w-full flex items-center justify-center text-center outline-none",
                    font.className
                )}
                style={{
                    fontSize: calculateFontSize(width, height),
                    // STEAL THIS: Automatic text color based on background
                    color: fill ? getContrastingTextColor(fill) : "#fff", 
                }}
            />
        </foreignObject>
    );
};