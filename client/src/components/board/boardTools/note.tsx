"use client";

import { forwardRef, memo } from "react";
import { Kalam } from "next/font/google";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
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
    onValueChange: (value: string) => void;
}

const calculateFontSize = (width: number, height: number) => {
    const scaleFactor = 0.15;
    return Math.min(96, height * scaleFactor, width * scaleFactor);
};

export const Note = memo(
    forwardRef<SVGForeignObjectElement, NoteProps>(
        ({ id, layer, onPointerDown, selectionColor, onValueChange }, ref) => {
            const { x, y, width, height, fill, value } = layer;

            return (
                <foreignObject
                    ref={ref} // For 120fps dragging logic
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    onPointerDown={(e) => onPointerDown(e, id)}
                    style={{
                        outline: selectionColor ? `1px solid ${selectionColor}` : "none",
                        backgroundColor: fill ? ColorToCss(fill) : "#000",
                        transition: "none !important", // Prevent jitter during manual DOM moves
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
                            color: fill ? getContrastingTextColor(fill) : "#fff", 
                        }}
                    />
                </foreignObject>
            );
        }
    )
);

Note.displayName = "Note";