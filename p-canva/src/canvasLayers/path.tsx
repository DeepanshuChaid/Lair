import { getSvgPathFromStroke } from "@/lib/utils";
import getStroke from "perfect-freehand";

interface PathProps {
    x: string;
    y: string;
    points: number[][]
    fill: string
    onPointerDown: (e: React.PointerEvent) => void
    stroke?: string
}

export default function Path ({x, y, points, fill, onPointerDown, stroke}: PathProps) {
    
    return (
        <path
            className="drop-shadow-md"
            onPointerDown={onPointerDown}
            d={getSvgPathFromStroke(
                getStroke(points, {
                    size: 10, 
                    thinning: 0.5,
                    smoothing: 0.5,
                    streamline: 0.5,
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
    )
}