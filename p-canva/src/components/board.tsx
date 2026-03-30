"use client"

import Rectangle from "@/canvasLayers/rectangle";
import { Button } from "@/components/ui/button";
import { CanvasState, CanvasMode, Layer, LayerType, Point, RectangleLayer, Color } from "@/types/types";
import { useCallback, useRef, useState } from "react";

export default function Board () {
    const [canvasState, setCanvasState] = useState<CanvasState>({mode: CanvasMode.Inserting, layerType: LayerType.Rectangle})

    const [layers, setLayer] = useState<Array<{ id: string; layer: any }>>([]);
    const [draftLayer, setDraftLayer] = useState<Array<{ id: string; layer: any }>>([]);

    const [selection, setSelection] = useState<string[]>([])

    const [lastUsedColor, setLastUsedColor] = useState<Color>({ r: 252, g: 142, b: 42 });

    

    // Use refs to store mutable values that don't trigger re-renders
    const startPointRef = useRef<Point | null>(null);
    
    const onPointerDown = useCallback(() => {
        
    }, [])
    const onPointerUp = useCallback(() => {
        
    }, [])


    
    const onSvgPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
        console.log("DOWN EVENT", e.clientX, e.clientY)
        const coords = {x: e.clientX, y: e.clientY}
        
        if (canvasState.mode === CanvasMode.Inserting) {
          startPointRef.current = coords
          console.log("start point", startPointRef.current)
        }
    }, [])

    const onSvgPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
        // console.log("MOVE EVENT", e.clientX, e.clientY)
        const coords = {x: e.clientX, y: e.clientY}

        if (canvasState.mode === CanvasMode.Inserting && startPointRef.current) {
            // here we will show the preview of the layer that is being created using the starting point and the current point to calculate the XYMH and then we can set the draft layer to that XYMH so that it can be rendered on the screen
            const start = startPointRef.current;

            // a reminder that we are first getting the closest point to the top left corner
            // and subs the length of x of starting point to get the width and same for height to get the distance from the starting point to the current point which will be the width and height of the rectangle
            let width = Math.abs(coords.x - start.x);
            let height = Math.abs(coords.y - start.y);
            let x = Math.min(start.x, coords.x);
            let y = Math.min(start.y, coords.y);

            const newDraftLayer = {
                id: "draft",
                 layer: {
                    type: canvasState.layerType,
                    x,
                    y,
                    width,
                    height,
                    fill: lastUsedColor
                  }}

            console.log("DRAFT LAYER", newDraftLayer)
            


            setDraftLayer(
              prev => [...prev, newDraftLayer]
            )
        }

    }, [lastUsedColor, canvasState])

    const onSvgPointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
        console.log("UP EVENT", e.clientX, e.clientY)
        const coords = {x: e.clientX, y: e.clientY}

        if (canvasState.mode === CanvasMode.Inserting && startPointRef.current) {
            const start = startPointRef.current;

            // subtracting start from coords give us the distance and ABS gives us positive value for width and height regardless of the direction of the drag
            let width = Math.abs(coords.x - start.x);
            let height = Math.abs(coords.y - start.y);

            // we are getting minimum of start and coords to get the top left corner of the rectangle regardless of the direction of the drag
            // basically x and y are distance from the top left corner so the closer or i say minimum value would be the distance from the corner
            let x = Math.min(start.x, coords.x);
            let y = Math.min(start.y, coords.y);

            if (width < 5 && height < 5) {
                width = 100 
                height = 100
                // todo minus from x and y
            }

            const newId = `layer-${Math.random().toString(36).substr(2, 9)}`;
            const newLayer = {type: canvasState.layerType, x, y, width, height, fill: lastUsedColor, value: ""} as RectangleLayer;

            // after calculating the XYMH we can just push the new layer
            setLayer(prev => [...prev, {id: newId, layer: newLayer}])

            // here we can clear the starting point and draft layer and reset the canvas state to none 
            // basically switch to cursor after creating the rectangle
            startPointRef.current = null;
            setDraftLayer([]);
            // setCanvasState({mode: CanvasMode.None})
        }
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
          {draftLayer?.map(({id, layer}, index) => {
            if (layer.type === LayerType.Rectangle) {
              return (
               <Rectangle 
                id={id}
                key={index}
                onPointerDown={()=> {}}
                Layer={layer}
               />
              ) 
            }
          })}

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