"use client"

import Rectangle from "@/canvasLayers/rectangle";
import { Button } from "@/components/ui/button";
import Toolbar from "@/components/toolbar";
import { CanvasState, CanvasMode, Layer, LayerType, Point, RectangleLayer, Color } from "@/types/types";
import { useCallback, useEffect, useRef, useState } from "react";
import Ellipse from "@/canvasLayers/ellipse";

export default function Board () {
    const [canvasState, setCanvasState] = useState<CanvasState>({mode: CanvasMode.Inserting, layerType: LayerType.Rectangle})

    const [layers, setLayer] = useState<Array<{ id: string; layer: any }>>([]);

    // To this:
    const [draftLayer, setDraftLayer] = useState<{ id: string; layer: Layer } | null>(null);

    const [selection, setSelection] = useState<string[]>([])

    const [camera, setCamera] = useState<{ x: number; y: number; scale: number }>({ x: 0, y: 0, scale: 1 });

    const [lastUsedColor, setLastUsedColor] = useState<Color>({ r: 252, g: 142, b: 42 });


    const svgRef = useRef<SVGSVGElement>(null);

    // ZOOM LOGIC
    const onWheel = useCallback((e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        const zoomSpeed = 0.001;
        const delta = -e.deltaY
        const scaleChange = delta * zoomSpeed;

        setCamera(prev => {
          const newScale = Math.min(Math.max(prev.scale + scaleChange, 0.1), 10)
          const dx = (e.clientX - prev.x) * (newScale / prev.scale - 1)
          const dy = (e.clientY - prev.y) * (newScale / prev.scale - 1)
          return {x: prev.x - dx, y: prev.y - dy, scale: newScale}
        })
      } else {
        setCamera(prev => ({
          ...prev,
          x: prev.x - (e.shiftKey ? e.deltaY : e.deltaX),
          y: prev.y - (e.shiftKey ? e.deltaX : e.deltaY)
        }))
      }
    }, [])

    useEffect(() => {
      const svg = svgRef.current;
      if (svg) {
      svg.addEventListener("wheel", onWheel, {passive: false});
      return () => {
        svg.removeEventListener("wheel", onWheel);
      }
    }}, [])

    const clientToWorld = useCallback((clientX: number, clientY: number) => {
        const bounds = svgRef.current?.getBoundingClientRect();
        if (!bounds) return { x: clientX, y: clientY };
        return {
            x: (clientX - bounds.left - camera.x) / camera.scale,
            y: (clientY - bounds.top - camera.y) / camera.scale
        };
    }, [camera])

    // Use refs to store mutable values that don't trigger re-renders
    const startPointRef = useRef<Point | null>(null);
    
    const onPointerDown = useCallback(() => {
        
    }, [])
    const onPointerUp = useCallback(() => {
        
    }, [])

    useEffect(() => {
      const interval = setInterval(() => {
        // console.log("Canvas State:", canvasState);
        console.log("Layers:", layers);
      }, 5000)
      return () => clearInterval(interval);
    }, [canvasState])
    
    const onSvgPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
        console.log("DOWN EVENT", e.clientX, e.clientY)
        const coords = clientToWorld(e.clientX, e.clientY);
        
        if (canvasState.mode === CanvasMode.Inserting) {
          startPointRef.current = coords
          console.log("start point", startPointRef.current)
        }
    }, [canvasState, clientToWorld])

    const onSvgPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
        // console.log("MOVE EVENT", e.clientX, e.clientY)
        const coords = clientToWorld(e.clientX, e.clientY);   

        if (canvasState.mode === CanvasMode.Inserting && startPointRef.current) {
            // here we will show the preview of the layer that is being created using the starting point and the current point to calculate the XYMH and then we can set the draft layer to that XYMH so that it can be rendered on the screen
            const start = startPointRef.current;

            // a reminder that we are first getting the closest point to the top left corner
            // and subs the length of x of starting point to get the width and same for height to get the distance from the starting point to the current point which will be the width and height of the rectangle
            let width = Math.abs(coords.x - start.x);
            let height = Math.abs(coords.y - start.y);
            let x = Math.min(start.x, coords.x);
            let y = Math.min(start.y, coords.y);


            setDraftLayer({
                id: "draft",
                layer: {
                    type: canvasState.layerType,
                    x,
                    y,
                    width,
                    height,
                    fill: lastUsedColor
                } as Layer
            });
        }

    }, [lastUsedColor, canvasState, clientToWorld])

    const onSvgPointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
        console.log("UP EVENT", e.clientX, e.clientY)
        const coords = clientToWorld(e.clientX, e.clientY);

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
            setDraftLayer(null);
            setCanvasState({mode: CanvasMode.None})
        }
    }, [canvasState, clientToWorld, lastUsedColor])


    return (
        <div className="h-screen w-full relative overflow-hidden bg-amber-100">
          <Toolbar canvasState={canvasState} setCanvasState={setCanvasState} />


        <svg 
          className="top-0 left-0 w-full h-full" 
          ref={svgRef}
          onPointerDown={onSvgPointerDown}
          onPointerMove={onSvgPointerMove}
          onPointerUp={onSvgPointerUp}
          style={{ backgroundColor: "#000" }}
        >
          <g style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`, transformOrigin: "0 0" }}>

          {draftLayer && (
            draftLayer.layer.type === LayerType.Rectangle ? (
              <Rectangle
                id={draftLayer.id}
                key={draftLayer.id}
                layer={draftLayer.layer}
                onPointerDown={() => {}}
              />
            ) : draftLayer.layer.type === LayerType.Ellipse ? (
              <Ellipse
                id={draftLayer.id}
                key={draftLayer.id}
                layer={draftLayer.layer}
                onPointerDown={() => {}}
              />
            ) : null
          )}


          {layers.map(({id: layerId, layer}) => {
            const selectionColor = selection.includes(layerId) ? "transparent" : undefined;
            if (layer.type === LayerType.Rectangle) {
             return (
               <Rectangle
                 key={layerId}
                 id={layerId}
                 layer={layer}
                 onPointerDown={onPointerDown}
                 selectionColor={selectionColor}
               />
             )
            }

            if (layer.type === LayerType.Ellipse) {
              return (
                <Ellipse
                  key={layerId}
                  id={layerId}
                  layer={layer}
                  onPointerDown={onPointerDown}
                  selectionColor={selectionColor}
                />
              )
            }
        })}
         </g>
        </svg>
      </div>
    )
}