"use client";

import { memo } from "react";
import { MousePointer2 } from "lucide-react";

interface CursorProps {
    x: number;
    y: number;
    name: string;
    connectionId: string;
}

const Cursor = memo(({ x, y, name, connectionId }: CursorProps) => {
    // Generate a simple color based on connectionId
    const color = `hsl(${parseInt(connectionId) % 360 || 0}, 70%, 50%)`;

    return (
        <foreignObject
            style={{
                transform: `translateX(${x}px) translateY(${y}px)`,
                transition: "transform 0.05s linear",
                userSelect: "none",
            }}
            height={50}
            width={name.length * 10 + 24}
            className="relative drop-shadow-md"
        >
            <MousePointer2 
                className="h-5 w-5"
                style={{
                    fill: color,
                    color: color,
                }}
            />
            <div 
                className="absolute left-5 px-1.5 py-0.5 rounded-md text-xs text-white font-semibold"
                style={{ backgroundColor: color }}
            >
                {name}
            </div>
        </foreignObject>
    );
});

Cursor.displayName = "Cursor";
export default Cursor;