"use client";

import { Inter } from "next/font/google"; // A cleaner, professional font
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import { cn, ColorToCss } from "@/lib/utils";
import { TextLayer } from "@/types/canvas";

const font = Inter({ subsets: ["latin"] });

interface TextProps {
    id: string;
    layer: TextLayer;
    onPointerDown: (e: React.PointerEvent, id: string) => void;
    selectionColor?: string;
    onValueChange: (value: string) => void;
}

const calculateFontSize = (width: number, height: number) => {
    const scaleFactor = 0.2; // Text usually fills more of the box than a note
    return Math.min(120, height * scaleFactor);
};

export const Text = ({ id, layer, onPointerDown, selectionColor, onValueChange }: TextProps) => {
    const { x, y, width, height, fill, value } = layer;

    return (
        <foreignObject
            x={x}
            y={y}
            width={width}
            height={height}
            onPointerDown={(e) => onPointerDown(e, id)}
            style={{
                outline: selectionColor ? `1px solid ${selectionColor}` : "none",
            }}
        >
            <ContentEditable
                html={value || "Type..."}
                onChange={(e: ContentEditableEvent) => onValueChange(e.target.value)}
                className={cn(
                    "h-full w-full flex items-center justify-center text-center outline-none bg-transparent",
                    font.className
                )}
                style={{
                    fontSize: calculateFontSize(width, height),
                    color: fill ? ColorToCss(fill) : "#000",
                }}
            />
        </foreignObject>
    );
};