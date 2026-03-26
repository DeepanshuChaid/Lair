"use client";

import { memo } from "react";
import { Layer, layerType, color } from "@/types/canvas";
import { Rectangle } from "./boardTools/rectangle"; // Adjust path as needed
import { Ellipse } from "./boardTools/ellipse";
// Import Ellipse, Text, etc. later

interface LayerPreviewProps {
    id: string;
    layer: Layer;
    onLayerPointerDown: (e: React.PointerEvent, layerId: string) => void;
    selectionColor?: string;
}

export const LayerPreview = memo(({ 
    id, 
    layer, 
    onLayerPointerDown, 
    selectionColor 
}: LayerPreviewProps) => {
    
    switch (layer.type) {
        case layerType.Rectangle:
            return (
                <Rectangle
                    id={id}
                    layer={layer}
                    onPointerDown={onLayerPointerDown}
                    selectionColor={selectionColor}
                />
            );
        case layerType.Ellipse:
            return (
                <Ellipse
                    id={id}
                    layer={layer}
                    onPointerDown={onLayerPointerDown}
                    selectionColor={selectionColor}
                />
            );
        // Add other cases (Ellipse, Text) here as you build them
        default:
            console.warn("Unknown layer type");
            return null;
    }
});

LayerPreview.displayName = "LayerPreview";