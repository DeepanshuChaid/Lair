"use client";

import { forwardRef, memo } from "react";
import getStroke from "perfect-freehand";
import { getSvgPathFromStroke } from "@/lib/utils";

interface PathProps {
    x: number;
    y: number;
    points: number[][];
    fill: string;
    onPointerDown?: (e: React.PointerEvent) => void;
    stroke?: string;
}

export const Path = memo(
    forwardRef<SVGPathElement, PathProps>(
        ({ x, y, points, fill, onPointerDown, stroke }, ref) => {
            return (
                <path
                    ref={ref} // Attach ref so we can move the finished path at 120fps
                    className="drop-shadow-md"
                    onPointerDown={onPointerDown}
                    d={getSvgPathFromStroke(
                        getStroke(points, {
                            size: 10,
                            thinning: 0.5,
                            smoothing: 0.8,
                            streamline: 0.8,
                        })
                    )}
                    style={{
                        transform: `translate(${x}px, ${y}px)`,
                        transition: "none !important",
                    }}
                    fill={fill}
                    stroke={stroke || "transparent"}
                    strokeWidth={1}
                />
            );
        }
    )
);

Path.displayName = "Path";