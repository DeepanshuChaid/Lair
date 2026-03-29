"use client"

import Rectangle from "@/canvasLayers/rectangle";
import { Button } from "@/components/ui/button";
import { Layer, LayerType, RectangleLayer } from "@/types/types";
import { useCallback, useState } from "react";

export default function Board () {
    const [layers, setLayer] = useState<Array<{ id: string; layer: any }>>([]);
    const [draftLayer, setDraftLayer] = useState<Array<{ id: string; layer: any }>>([]);

    const [selection, setSelection] = useState<string[]>([])

    const [startPoint, setStartPoint] = useState<{x: number, y: number} | null>(null)

    
    const onPointerDown = useCallback(() => {
        
    }, [])
    const onPointerUp = useCallback(() => {
        
    }, [])


    
    const onSvgPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
        console.log("DOWN EVENT", e.clientX, e.clientY)
        const coords =
        setStartPoint({x: e.clientX, y: e.clientY})
    }, [])

    const onSvgPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
        console.log("MOVE EVENT", e.clientX, e.clientY)


    }, [])

    const onSvgPointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
        console.log("UP EVENT", e.clientX, e.clientY)

    }, [])


    return (
        <div className="h-screen w-full relative overflow-hidden bg-amber-100">
        <svg 
          className="absolute top-0 left-0 w-full h-full" 
          onPointerDown={onSvgPointerDown}
          onPointerMove={onSvgPointerMove}
          onPointerUp={onSvgPointerUp}
          style={{ backgroundColor: "#000" }}
        >
          {/* {draftLayer?.map((layer: RectangleLayer, index: number) => {
           return (
            <rect 
            key={index}
            x={layer.x}
            y={layer.y}
            width={layer.width}
            height={layer.height}
            fill={layer.fill}
            />
           ) 
          })} */}

          {layers.map(({id: layerId, layer}) => {
            const selectionColor = selection.includes(layerId) ? "transparent" : undefined;
            if (layer.type === LayerType.Rectangle) {
             return (
               <Rectangle
                 key={layerId}
                 id={layerId}
                 Layer={layer}
                 onPointerDown={onPointerDown}
                 selectionColor={selectionColor}
               />
             )
            }
        })}
        </svg>
      </div>
    )
}