import { EllipseLayer } from "@/types/types";
import { ColorToCss } from "@/lib/utils";

interface EllipseProps {
    id: string;
    layer: EllipseLayer
    onPointerDown: (e: React.PointerEvent, layerId: string) => void;
    selectionColor?: string;
}

export default function Ellipse ({ id, layer, onPointerDown, selectionColor }: EllipseProps) {
    const { x, y, width, height, fill } = layer;

    return (
            <ellipse 
                className="drop-shadow-md"
                onPointerDown={(e) => onPointerDown(e, id)}
                
                cx={width / 2}
                style={{
                    transform: `translate(${x}px, ${y}px)`,
                }}
                cy={height / 2}
                rx={width / 2}
                ry={height / 2}
                fill={fill ? ColorToCss(fill) : "#000"}
                stroke={selectionColor}
                strokeWidth="1"
            />
    )
}