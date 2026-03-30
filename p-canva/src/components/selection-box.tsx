"use client";

import { Side, XYMH } from "@/types/types";
import { memo } from "react";

interface SelectionBoxProps {
  bounds: XYMH | null;
  onResizeHandlerPointerDown: (
    corner: Side,
    initialBounds: XYMH | null,
  ) => void;
  isShowingHandles: boolean;
}

const HANDLE_WIDTH = 8;

export const SelectionBox = memo(
  ({
    bounds,
    onResizeHandlerPointerDown,
    isShowingHandles,
  }: SelectionBoxProps) => {
    if (!bounds) return null;

    return (
      <>
        <rect
          className="fill-transparent stroke-blue-500 stroke-1 pointer-events-none"
          style={{ transform: `translate(${bounds?.x}px, ${bounds?.y}px)` }}
          // x and y are 0 because the rect is being translated to the correct position using CSS transform
          x={0}
          y={0}
          width={bounds?.width}
          height={bounds?.height}
        />

        {isShowingHandles && (
          <>
            {/* Top Edge */}
            <rect
              className="fill-transparent hover:fill-blue-500/20"
              style={{
                cursor: "ns-resize",
                transform: `translate(${bounds?.x}px, ${bounds.y - HANDLE_WIDTH / 2}px)`,
              }}
              x={0}
              y={0}
              // x is calculated using CSS transform, and width is handled with the height
              width={bounds?.width}
              height={HANDLE_WIDTH}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeHandlerPointerDown(Side.top, bounds);
              }}
            />

            {/* Bottom Edge */}
            <rect 
                className="fill transparent hover:fill-blue-500/20"

                style={{
                    cursor: "ns-resize",
                    transform: `translate(${bounds?.x}px, ${bounds.y + bounds.height - HANDLE_WIDTH / 2}px)`
                }}

                x={0}
                y={0}

                width={bounds?.width}
                height={HANDLE_WIDTH}

                onPointerDown={(e) => {
                    e.stopPropagation()
                    onResizeHandlerPointerDown(Side.bottom, bounds)
                }}
            />

            {/* Right Edge */}
            <rect 
                className="fill-transparent hover:fill-blue-500/20"
                style={{
                    cursor: "ew-resize",
                    transform: `translate(${bounds.x + bounds.width - HANDLE_WIDTH / 2}px, ${bounds.y}px)`
                }}
                x={0}
                y={0}
                width={HANDLE_WIDTH}
                height={bounds.height}
                onPointerDown={(e) => {
                    e.stopPropagation()
                    onResizeHandlerPointerDown(Side.right, bounds)
                }}
             />
             
             {/* Left Edge */}
             <rect 
                className="fill-transparent hover:fill-blue-500/20"
                style={{
                    cursor: "ew-resize",
                    transform: `translate(${bounds.x - HANDLE_WIDTH / 2}px, ${bounds.y}px)`
                }}
                x={0}
                y={0}
                width={HANDLE_WIDTH}
                height={bounds.height}
                onPointerDown={(e) => {
                    e.stopPropagation()
                    onResizeHandlerPointerDown(Side.right, bounds)
                }}
             />

             {/* CORNER HANDLERS */}
             {/* Top Left Corner */}
             <rect 
                className="fill-white stroke-1 stroke-blue-500"
                style={{
                    cursor: "nwse-resize",
                    width: `${HANDLE_WIDTH}px`,
                    height: `${HANDLE_WIDTH}px`,
                    transform: `translate(${bounds.x - HANDLE_WIDTH / 2}px, ${bounds.y - HANDLE_WIDTH / 2}px)`
                }}

                onPointerDown={(e) => {
                    e.stopPropagation()
                    onResizeHandlerPointerDown(Side.top + Side.left, bounds)
                }}
             />

             {/* Top Right Corner */}
             <rect 
                className="fill-white stroke-1 stroke-blue-500"
                style={{
                    cursor: "nesw-resize",
                    width: `${HANDLE_WIDTH}px`,
                    height: `${HANDLE_WIDTH}px`,
                    transform: `translate(${bounds.x + bounds.width - HANDLE_WIDTH / 2}px, ${bounds.y - HANDLE_WIDTH / 2}px)`
                }}
                onPointerDown={(e) => {
                    e.stopPropagation()
                    onResizeHandlerPointerDown(Side.top + Side.right, bounds)
                }}
             />

             {/* Bottom Left Corner */}
             <rect 
                className="fill-white stroke-1 stroke-blue-500"
                style={{
                    cursor: "nwse-resize",
                    width: `${HANDLE_WIDTH}px`,
                    height: `${HANDLE_WIDTH}px`,
                    transform: `translate(${bounds.x - HANDLE_WIDTH / 2}px, ${bounds.y + bounds.height - HANDLE_WIDTH / 2}px)`
                }}
                onPointerDown={(e) => {
                    e.stopPropagation()
                    onResizeHandlerPointerDown(Side.bottom + Side.left, bounds)
                }}
             />

             {/* Bottom Right Corner */}
             <rect 
                className="fill-white stroke-1 stroke-blue-500"
                style={{
                    cursor: "nesw-resize",
                    width: `${HANDLE_WIDTH}px`,
                    height: `${HANDLE_WIDTH}px`,
                    transform: `translate(${bounds.x + bounds.width - HANDLE_WIDTH / 2}px, ${bounds.y + bounds.height - HANDLE_WIDTH / 2}px)`
                }}
                onPointerDown={(e) => {
                    e.stopPropagation()
                    onResizeHandlerPointerDown(Side.bottom + Side.right, bounds)
                }}

             />

          </>
        )}
      </>
    );
  },
);

SelectionBox.displayName = "SelectionBox";
