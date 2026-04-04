"use client";

import { forwardRef, memo, useState } from "react";
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
    const scaleFactor = 0.2;
    return Math.min(96, height * scaleFactor, width * scaleFactor);
};

export const Note = memo(
    forwardRef<SVGForeignObjectElement, NoteProps>(
        ({ id, layer, onPointerDown, selectionColor, onValueChange }, ref) => {
            const { x, y, width, height, fill, value } = layer;

            const [isEditing, setIsEditing] = useState(false)

            return (
              <foreignObject
                ref={ref} // For 120fps dragging logic
                transform={`translate(${x}, ${y})`}
                width={width}
                height={height}
                onDoubleClick={() => setIsEditing(true)}
                onPointerDown={(e) => {
                  if (!isEditing) onPointerDown(e, id);
                }}
                style={{
                  outline: selectionColor
                    ? `1px solid ${selectionColor}`
                    : "none",
                  backgroundColor: fill ? ColorToCss(fill) : "#000",
                  transition: "none !important", // Prevent jitter during manual DOM moves
                }}
                className="shadow-md drop-shadow-xl"
              >
                <ContentEditable
                  html={value || "Type..."}
                  disabled={!isEditing}
                  // in WEB DEV ON BLUR MEANS YOU LOST THE FOCUS ON THE ELEMENT ITS THE OPPOSITE OF ONFOCUS
                  onBlur={() => setIsEditing(false)}
                  onChange={(e: ContentEditableEvent) =>
                    onValueChange(e.target.value)
                  }
                  className={cn(
                    "h-full w-full flex items-center justify-center text-center outline-none",
                    font.className,
                  )}
                  style={{
                    fontSize: calculateFontSize(width, height),
                    color: fill ? getContrastingTextColor(fill) : "#fff",
                    userSelect: isEditing ? "text" : "none",
                    pointerEvents: isEditing ? "all" : "none",
                  }}
                />
              </foreignObject>
            );
        }
    )
);

Note.displayName = "Note";