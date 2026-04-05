"use client";

import { memo, useEffect } from "react";
import { Side, XYMH, layerType } from "@/types/canvas";

interface SelectionBoxProps {
  bounds: XYMH | null;
  onResizeHandlePointerDown: (corner: Side, initialBounds: XYMH, e: React.PointerEvent) => void;
  isShowingHandles: boolean;
  isPath: boolean;
  scale: number;
}

export const SelectionBox = memo(
  ({
    bounds,
    onResizeHandlePointerDown,
    isShowingHandles,
    isPath,
    scale,
  }: SelectionBoxProps) => {
    if (!bounds) return null;
    if (isPath) return null;

    const HANDLE_WIDTH = scale > 2 ? scale * 12 : 8; // Slightly larger for better mobile/touch hits

    return (
      <>
        {/* Main Selection Border */}
        <rect
          className="fill-transparent stroke-blue-500 stroke-1 pointer-events-none"
          x={0}
          y={0}
          style={{
            transform: `translate(var(--sel-x, ${bounds.x}px), var(--sel-y, ${bounds.y}px))`,
            width: `var(--sel-w, ${bounds.width}px)`,
            height: `var(--sel-h, ${bounds.height}px)`,
          }}
        />

        {isShowingHandles && (
          <>
            {/* --- EDGE HANDLES (Figma style) --- */}
            {/* Top Edge */}
            <rect
              className="fill-transparent hover:fill-blue-500/20"
              style={{
                cursor: "ns-resize",
                transform: `translate(var(--sel-x, ${bounds.x}px), calc(var(--sel-y, ${bounds.y}px) - ${HANDLE_WIDTH / 2}px))`,
                width: `var(--sel-w, ${bounds.width}px)`,
                height: `${HANDLE_WIDTH}px`,
              }}
              x={0}
              y={0}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.top, bounds, e);
              }}
            />
            {/* Bottom Edge */}
            <rect
              className="fill-transparent hover:fill-blue-500/20"
              style={{
                cursor: "ns-resize",
                transform: `translate(var(--sel-x, ${bounds.x}px), calc(var(--sel-y, ${bounds.y}px) + var(--sel-h, ${bounds.height}px) - ${HANDLE_WIDTH / 2}px))`,
                width: `var(--sel-w, ${bounds.width}px)`,
                height: `${HANDLE_WIDTH}px`,
              }}
              x={0}
              y={0}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.bottom, bounds, e);
              }}
            />
            {/* Left Edge */}
            <rect
              className="fill-transparent hover:fill-blue-500/20"
              style={{
                cursor: "ew-resize",
                transform: `translate(calc(var(--sel-x, ${bounds.x}px) - ${HANDLE_WIDTH / 2}px), var(--sel-y, ${bounds.y}px))`,
                width: `${HANDLE_WIDTH}px`,
                height: `var(--sel-h, ${bounds.height}px)`,
              }}
              x={0}
              y={0}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.left, bounds, e);
              }}
            />
            {/* Right Edge */}
            <rect
              className="fill-transparent hover:fill-blue-500/20"
              style={{
                cursor: "ew-resize",
                transform: `translate(calc(var(--sel-x, ${bounds.x}px) + var(--sel-w, ${bounds.width}px) - ${HANDLE_WIDTH / 2}px), var(--sel-y, ${bounds.y}px))`,
                width: `${HANDLE_WIDTH}px`,
                height: `var(--sel-h, ${bounds.height}px)`,
              }}
              x={0}
              y={0}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.right, bounds, e);
              }}
            />

            {/* --- CORNER HANDLES (Keep existing) --- */}
            <rect
              className="fill-white stroke-1 stroke-blue-500"
              style={{
                cursor: "nwse-resize",
                width: `${HANDLE_WIDTH}px`,
                height: `${HANDLE_WIDTH}px`,
                transform: `translate(calc(var(--sel-x, ${bounds.x}px) - ${HANDLE_WIDTH / 2}px), calc(var(--sel-y, ${bounds.y}px) - ${HANDLE_WIDTH / 2}px))`,
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.top + Side.left, bounds, e);
              }}
            />
            <rect
              className="fill-white stroke-1 stroke-blue-500"
              style={{
                cursor: "nesw-resize",
                width: `${HANDLE_WIDTH}px`,
                height: `${HANDLE_WIDTH}px`,
                transform: `translate(calc(var(--sel-x, ${bounds.x}px) + var(--sel-w, ${bounds.width}px) - ${HANDLE_WIDTH / 2}px), calc(var(--sel-y, ${bounds.y}px) - ${HANDLE_WIDTH / 2}px))`,
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.top + Side.right, bounds, e);
              }}
            />
            <rect
              className="fill-white stroke-1 stroke-blue-500"
              style={{
                cursor: "nwse-resize",
                width: `${HANDLE_WIDTH}px`,
                height: `${HANDLE_WIDTH}px`,
                transform: `translate(calc(var(--sel-x, ${bounds.x}px) + var(--sel-w, ${bounds.width}px) - ${HANDLE_WIDTH / 2}px), calc(var(--sel-y, ${bounds.y}px) + var(--sel-h, ${bounds.height}px) - ${HANDLE_WIDTH / 2}px))`,
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.bottom + Side.right, bounds, e);
              }}
            />
            <rect
              className="fill-white stroke-1 stroke-blue-500"
              style={{
                cursor: "nesw-resize",
                width: `${HANDLE_WIDTH}px`,
                height: `${HANDLE_WIDTH}px`,
                transform: `translate(calc(var(--sel-x, ${bounds.x}px) - ${HANDLE_WIDTH / 2}px), calc(var(--sel-y, ${bounds.y}px) + var(--sel-h, ${bounds.height}px) - ${HANDLE_WIDTH / 2}px))`,
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlePointerDown(Side.bottom + Side.left, bounds, e);
              }}
            />
          </>
        )}
      </>
    );
  },
);

SelectionBox.displayName = "SelectionBox";
