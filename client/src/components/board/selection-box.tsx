"use client";

import { memo, useEffect } from "react";
import { Side, XYMH, layerType } from "@/types/canvas";

interface SelectionBoxProps {
  bounds: XYMH | null;
  onResizeHandlePointerDown: (corner: Side, initialBounds: XYMH) => void;
  isShowingHandles: boolean;
  isPath: boolean;
  scale: number
}


export const SelectionBox = memo(
  ({
    bounds,
    onResizeHandlePointerDown,
    isShowingHandles,
    isPath,
    scale
  }: SelectionBoxProps) => {
    if (!bounds) return null;
    if (isPath) return null;

    const HANDLE_WIDTH = scale > 2 ? scale * 12 : 8; // Slightly larger for better mobile/touch hits

    return (
      <>
        {/* Main Selection Border */}
        <rect
          className="fill-transparent stroke-blue-500 stroke-1 pointer-events-none"
          transform={`translate(${bounds.x}, ${bounds.y})`}
          x={0}
          y={0}
          width={bounds.width}
          height={bounds.height}
        />

        {isShowingHandles && (
          <>
            {/* --- EDGE HANDLES (Figma style) --- */}
            {/* Top Edge */}
            <rect
              className="fill-transparent hover:fill-blue-500/20"
              style={{
                cursor: "ns-resize",
              }}
              transform={`translate(${bounds.x}, ${bounds.y - HANDLE_WIDTH / 2})`}
              x={0}
              y={0}
              width={bounds.width}
              height={HANDLE_WIDTH}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.top, bounds);
              }}
            />
            {/* Bottom Edge */}
            <rect
              className="fill-transparent hover:fill-blue-500/20"
              style={{
                cursor: "ns-resize",
                transform: `translate(${bounds.x}px, ${bounds.y + bounds.height - HANDLE_WIDTH / 2}px)`,
              }}
              x={0}
              y={0}
              width={bounds.width}
              height={HANDLE_WIDTH}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.bottom, bounds);
              }}
            />
            {/* Left Edge */}
            <rect
              className="fill-transparent hover:fill-blue-500/20"
              style={{
                cursor: "ew-resize",
                transform: `translate(${bounds.x - HANDLE_WIDTH / 2}px, ${bounds.y}px)`,
              }}
              x={0}
              y={0}
              width={HANDLE_WIDTH}
              height={bounds.height}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.left, bounds);
              }}
            />
            {/* Right Edge */}
            <rect
              className="fill-transparent hover:fill-blue-500/20"
              style={{
                cursor: "ew-resize",
                transform: `translate(${bounds.x + bounds.width - HANDLE_WIDTH / 2}px, ${bounds.y}px)`,
              }}
              x={0}
              y={0}
              width={HANDLE_WIDTH}
              height={bounds.height}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.right, bounds);
              }}
            />

            {/* --- CORNER HANDLES (Keep existing) --- */}
            <rect
              className="fill-white stroke-1 stroke-blue-500"
              style={{
                cursor: "nwse-resize",
                width: `${HANDLE_WIDTH}px`,
                height: `${HANDLE_WIDTH}px`,
                transform: `translate(${bounds.x - HANDLE_WIDTH / 2}px, ${bounds.y - HANDLE_WIDTH / 2}px)`,
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.top + Side.left, bounds);
              }}
            />
            <rect
              className="fill-white stroke-1 stroke-blue-500"
              style={{
                cursor: "nesw-resize",
                width: `${HANDLE_WIDTH}px`,
                height: `${HANDLE_WIDTH}px`,
                transform: `translate(${bounds.x + bounds.width - HANDLE_WIDTH / 2}px, ${bounds.y - HANDLE_WIDTH / 2}px)`,
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.top + Side.right, bounds);
              }}
            />
            <rect
              className="fill-white stroke-1 stroke-blue-500"
              style={{
                cursor: "nwse-resize",
                width: `${HANDLE_WIDTH}px`,
                height: `${HANDLE_WIDTH}px`,
                transform: `translate(${bounds.x + bounds.width - HANDLE_WIDTH / 2}px, ${bounds.y + bounds.height - HANDLE_WIDTH / 2}px)`,
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.bottom + Side.right, bounds);
              }}
            />
            <rect
              className="fill-white stroke-1 stroke-blue-500"
              style={{
                cursor: "nesw-resize",
                width: `${HANDLE_WIDTH}px`,
                height: `${HANDLE_WIDTH}px`,
                transform: `translate(${bounds.x - HANDLE_WIDTH / 2}px, ${bounds.y + bounds.height - HANDLE_WIDTH / 2}px)`,
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.bottom + Side.left, bounds);
              }}
            />
          </>
        )}
      </>
    );
  },
);

SelectionBox.displayName = "SelectionBox";
