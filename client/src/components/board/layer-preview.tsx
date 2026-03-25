"use client";

import { color } from "@/types/canvas";
import { memo } from "react";

interface LayerPreviewProps {
    id: string;
    onLayerPointDown: (e: React.PointerEvent, layerId: string) => void;
    onLayerPointUp: (e: React.PointerEvent, layerId: string) => void;
    selectionColor: color;
}

export const LayerPreview = memo(({id, onLayerPointDown, onLayerPointUp, selectionColor}: LayerPreviewProps) => {
    return (
        <div >
        </div>
    )
})

LayerPreview.displayName = "LayerPreview"; 