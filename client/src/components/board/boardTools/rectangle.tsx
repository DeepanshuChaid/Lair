import { RectangleLayer } from "@/types/canvas";

interface RectangleProps {
    id: string;
    layer: RectangleLayer;
    onPointerDown: (e: React.PointerEvent, layerId: string) => void;
    selectionColor?: string;
}

export const Rectangle = ({id, layer, onPointerDown, selectionColor}: RectangleProps) => {
    const {x, y, height, width, fill} = layer;
    return (
        <rect
            className="drop-shadow-md"
            style={{
                transform: `translate(${x}px, ${y}px)`,
            }}
            id={id}
            x={x}
            y={y}
            height={height}
            width={width}
            strokeWidth={1}
            fill="#000"
            onPointerDown={(e) => onPointerDown(e, id)}
            stroke={selectionColor}
        />
    )
}