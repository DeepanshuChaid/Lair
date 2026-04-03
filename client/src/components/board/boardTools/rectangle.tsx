"use client";

import { forwardRef, memo } from "react";
import { ColorToCss } from "@/lib/utils";
import { RectangleLayer } from "@/types/canvas";

interface RectangleProps {
  id: string;
  layer: RectangleLayer;
  onPointerDown: (e: React.PointerEvent, layerId: string) => void;
  selectionColor?: string;
}

// 1. Wrap the forwardRef inside a memo
export const RectangleTool = memo(
  forwardRef<SVGRectElement, RectangleProps>(
    ({ id, layer, onPointerDown, selectionColor }, ref) => {
      const { x, y, height, width, fill } = layer;

      return (
        <rect
          ref={ref}
          className="drop-shadow-md"
          style={{
            transition: "none !important",
            cursor: "move",
          }}
          id={id}
          transform={`translate(${x}, ${y})`}
          height={height}
          width={width}
          strokeWidth={1}
          fill={fill ? ColorToCss(fill) : "#000"}
          onPointerDown={(e) => onPointerDown(e, id)}
          stroke={selectionColor}
        />
      );
    }
  )
);

RectangleTool.displayName = "RectangleTool";