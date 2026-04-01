"use client";

import { forwardRef, memo, useState } from "react";
import { Kalam } from "next/font/google";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import { cn, ColorToCss } from "@/lib/utils";
import { TextLayer } from "@/types/canvas";

const font = Kalam({
    subsets: ["latin"],
    weight: ["400"],
});

interface TextProps {
    id: string;
    layer: TextLayer;
    onPointerDown: (e: React.PointerEvent, id: string) => void;
    selectionColor?: string;
    onValueChange: (value: string) => void;
}

const calculateFontSize = (width: number, height: number) => {
    const scaleFactor = 0.2;
    return Math.min(120, height * scaleFactor);
};

export const Text = memo(
    forwardRef<SVGForeignObjectElement, TextProps>(
        ({ id, layer, onPointerDown, selectionColor, onValueChange }, ref) => {
            const { x, y, width, height, fill, value } = layer;
            const [isEditing, setisEditing] = useState(false);

            return (
                <foreignObject
                    ref={ref} // For 120fps dragging
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    onPointerDown={(e) => {
                        if (!isEditing) {
                            onPointerDown(e, id)
                        }
                    }}
                    onDoubleClick={() => setisEditing(true)}
                    style={{
                        outline: selectionColor ? `1px solid ${selectionColor}` : "none",
                        transition: "none !important", // Prevent lag during DOM mutation
                    }}
                >
                    <ContentEditable
                        html={value || "Type..."}
                        disabled={!isEditing}
                        onBlur={() => setisEditing(false)}
                        onChange={(e: ContentEditableEvent) => onValueChange(e.target.value)}
                        className={cn(
                            "h-full w-full flex items-center justify-center text-center outline-none bg-transparent",
                            font.className,
                            isEditing ? "cursor-text" : "cursor-default"
                        )}
                        style={{
                            fontSize: calculateFontSize(width, height),
                            color: fill ? ColorToCss(fill) : "#000",
                            pointerEvents: isEditing ? "all" : "none",
                            userSelect: isEditing ? "text" : "none",
                        }}
                    />
                </foreignObject>
            );
        }
    )
);

Text.displayName = "Text";