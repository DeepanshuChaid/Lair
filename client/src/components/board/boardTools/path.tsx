import { getSvgPathFromStroke } from "@/lib/utils";

interface PathProps {
    x: number;
    y: number;
    points: number[][];
    fill: string;
    onPointerDown?: (e: React.PointerEvent) => void;
    stroke?: string;
}

export const Path = ({ x, y, points, fill, onPointerDown, stroke }: PathProps) => {
    return (
        <path
            className="drop-shadow-md"
            onPointerDown={onPointerDown}
            d={getSvgPathFromStroke(points)}
            style={{
                transform: `translate(${x}px, ${y}px)`,
            }}
            x={0}
            y={0}
            fill={fill}
            stroke={stroke || fill}
            strokeWidth={1}
        />
    );
};