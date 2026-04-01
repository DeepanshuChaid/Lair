"use client";

import { forwardRef, memo } from "react";
import { ColorToCss } from "@/lib/utils";
import { EllipseLayer } from "@/types/canvas";

interface EllipseProps {
  id: string;
  layer: EllipseLayer;
  onPointerDown: (e: React.PointerEvent, layerId: string) => void;
  selectionColor?: string;
}

// 1. Wrap the forwardRef in memo
export const Ellipse = memo(
  forwardRef<SVGEllipseElement, EllipseProps>(
    ({ id, layer, onPointerDown, selectionColor }, ref) => {
      const { x, y, width, height, fill } = layer;

      return (
        <ellipse
          ref={ref}
          className="drop-shadow-md"
          onPointerDown={(e) => onPointerDown(e, id)}
          style={{
            // We use transform for the "Direct DOM" drag
            transform: `translate(${x}px, ${y}px)`,
            transition: "none",
          }}
          cx={width / 2}
          cy={height / 2}
          rx={width / 2}
          ry={height / 2}
          fill={fill ? ColorToCss(fill) : "#000"}
          stroke={selectionColor}
          strokeWidth="1"
        />
      );
    }
  )
);

Ellipse.displayName = "Ellipse";