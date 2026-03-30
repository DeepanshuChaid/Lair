import { ColorToCss } from "@/lib/utils";
import { RectangleLayer } from "@/types/types";

interface RectangleProps {
    id: string;
    layer: RectangleLayer
    onPointerDown: (e: React.PointerEvent, id: string) => void;
    selectionColor?: string;
}

export default function Rectangle({ id, layer, onPointerDown, selectionColor }: RectangleProps) {
    const { x, y, width, height, fill } = layer;

    return (
        <rect 
            className="drop-shadow-md"
            id={id}
            x={x}
            y={y}
            width={width}
            height={height}
            fill={fill ? ColorToCss(fill) : "#000"}
            onPointerDown={(e) => onPointerDown(e, id)}
            stroke={selectionColor}
            strokeWidth={1}
        />
    )
}