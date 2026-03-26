"use client";

import { memo } from "react";
import { Side, XYMH, layerType } from "@/types/canvas";

interface SelectionBoxProps {
    bounds: XYMH | null;
    onResizeHandlePointerDown: (corner: Side, initialBounds: XYMH) => void;
    isShowingHandles: boolean;
}

const HANDLE_WIDTH = 8; // Slightly larger for better mobile/touch hits

export const SelectionBox = memo(({ 
    bounds, 
    onResizeHandlePointerDown, 
    isShowingHandles 
}: SelectionBoxProps) => {
    if (!bounds) return null;

    return (
        <>
            {/* Main Selection Border */}
            <rect
                className="fill-transparent stroke-blue-500 stroke-1 pointer-events-none"
                style={{
                    transform: `translate(${bounds.x}px, ${bounds.y}px)`,
                }}
                x={0}
                y={0}
                width={bounds.width}
                height={bounds.height}
            />
            
            {isShowingHandles && (
                <>
                    {/* Top Left */}
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
                    {/* Top Right */}
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
                    {/* Bottom Right */}
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
                    {/* Bottom Left */}
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
});

SelectionBox.displayName = "SelectionBox";