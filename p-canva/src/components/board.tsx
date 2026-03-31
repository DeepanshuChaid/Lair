"use client";

import Rectangle from "@/canvasLayers/rectangle";
import Toolbar from "@/components/toolbar";
import {
  CanvasState,
  CanvasMode,
  Layer,
  LayerType,
  Point,
  RectangleLayer,
  Color,
  Side,
} from "@/types/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Ellipse from "@/canvasLayers/ellipse";
import Note from "@/canvasLayers/note";
import { Text } from "@/canvasLayers/text";
import { SelectionBox } from "./selection-box";

export default function Board() {
  const [canvasState, setCanvasState] = useState<CanvasState>({
    mode: CanvasMode.Inserting,
    layerType: LayerType.Rectangle,
  });

  const [layers, setLayer] = useState<Array<{ id: string; layer: any }>>([]);

  const [draftLayer, setDraftLayer] = useState<{
    id: string;
    layer: Layer;
  } | null>(null);

  const [camera, setCamera] = useState<{ x: number; y: number; scale: number }>(
    {
      x: 0,
      y: 0,
      scale: 1,
    },
  );

  const [lastUsedColor, setLastUsedColor] = useState<Color>({
    r: 252,
    g: 142,
    b: 42,
  });

  // HOLDS THE LIST OF SELECTED LAYERS
  const [selection, setSelection] = useState<string[]>([])
  const resizingBaseLayersRef = useRef<{id: string, layer: any} | null>(null)

  

  const svgRef = useRef<SVGSVGElement>(null);
  const startPointRef = useRef<Point | null>(null);

  // ZOOM & PAN LOGIC
  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const zoomSpeed = 0.001;
      const delta = -e.deltaY;
      const scaleChange = delta * zoomSpeed;

      setCamera((prev) => {
        const newScale = Math.min(Math.max(prev.scale + scaleChange, 0.1), 10);
        const dx = (e.clientX - prev.x) * (newScale / prev.scale - 1);
        const dy = (e.clientY - prev.y) * (newScale / prev.scale - 1);
        return { x: prev.x - dx, y: prev.y - dy, scale: newScale };
      });
    } else {
      setCamera((prev) => ({
        ...prev,
        x: prev.x - (e.shiftKey ? e.deltaY : e.deltaX),
        y: prev.y - (e.shiftKey ? e.deltaX : e.deltaY),
      }));
    }
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (svg) {
      svg.addEventListener("wheel", onWheel, { passive: false });
      return () => svg.removeEventListener("wheel", onWheel);
    }
  }, [onWheel]);

  const clientToWorld = useCallback(
    (clientX: number, clientY: number) => {
      const bounds = svgRef.current?.getBoundingClientRect();
      if (!bounds) return { x: clientX, y: clientY };
      return {
        x: (clientX - bounds.left - camera.x) / camera.scale,
        y: (clientY - bounds.top - camera.y) / camera.scale,
      };
    },
    [camera],
  );

  const handleValueChange = useCallback((id: string, value: string) => {
    setLayer((prevLayers) =>
      prevLayers.map((layerObj) =>
        layerObj.id === id
          ? { ...layerObj, layer: { ...layerObj.layer, value } }
          : layerObj,
      ),
    );
  }, []);

  const onSvgPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const coords = clientToWorld(e.clientX, e.clientY);
      if (canvasState.mode === CanvasMode.Inserting) {
        startPointRef.current = coords;
      }

      if (canvasState.mode === CanvasMode.None || canvasState.mode === CanvasMode.SelectionNet) {
        setSelection([]);
      }
    },
    [canvasState, clientToWorld],
  );

  const onSvgPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const coords = clientToWorld(e.clientX, e.clientY);

      if (canvasState.mode === CanvasMode.Inserting && startPointRef.current) {
        const start = startPointRef.current;
        setDraftLayer({
          id: "draft",
          layer: {
            type: canvasState.layerType,
            x: Math.min(start.x, coords.x),
            y: Math.min(start.y, coords.y),
            width: Math.abs(coords.x - start.x),
            height: Math.abs(coords.y - start.y),
            fill: lastUsedColor,
          } as Layer,
        });
      }

      
      if (canvasState.mode === CanvasMode.Resizing && canvasState.initialBounds) {
        const { initialBounds, corner } = canvasState;
        const newBounds = { ...initialBounds };

        // Horizontal Logic
        if ((corner & Side.left) === Side.left) {
          newBounds.x = Math.min(coords.x, initialBounds.x + initialBounds.width);
          newBounds.width = Math.abs(initialBounds.x + initialBounds.width - coords.x);
        } else if ((corner & Side.right) === Side.right) {
          newBounds.x = Math.min(coords.x, initialBounds.x);
          newBounds.width = Math.abs(coords.x - initialBounds.x);
        }

        // Vertical Logic
        if ((corner & Side.top) === Side.top) {
          newBounds.y = Math.min(coords.y, initialBounds.y + initialBounds.height);
          newBounds.height = Math.abs(initialBounds.y + initialBounds.height - coords.y);
        } else if ((corner & Side.bottom) === Side.bottom) {
          newBounds.y = Math.min(coords.y, initialBounds.y);
          newBounds.height = Math.abs(coords.y - initialBounds.y);
        }

        // UPDATE THE ACTUAL LAYER
        setLayer(prev => prev.map(l => 
          selection.includes(l.id) ? { ...l, layer: { ...l.layer, ...newBounds } } : l
        ));
      }

      if (canvasState.mode === CanvasMode.Translating && canvasState.current) {
        // we calculate the distance from initial position to current position
        const xDistance = coords.x - canvasState.current.x
        const yDistance = coords.y - canvasState.current.y

        // we add that distance to our layer
        setLayer(prev => 
          prev.map(l => 
            selection.includes(l.id)
             ? {...l, layer: {...l.layer, x: l.layer.x + xDistance, y: l.layer.y + yDistance}}
             : l
            )
        )

        // we set the new intial to our current position
        setCanvasState({mode: CanvasMode.Translating, current: coords})


      }

    }, [lastUsedColor, canvasState, clientToWorld],
  );

  const onSvgPointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const coords = clientToWorld(e.clientX, e.clientY);

      if (canvasState.mode === CanvasMode.Inserting && startPointRef.current) {
        const start = startPointRef.current;
        let width = Math.abs(coords.x - start.x);
        let height = Math.abs(coords.y - start.y);
        let x = Math.min(start.x, coords.x);
        let y = Math.min(start.y, coords.y);

        if (width < 5 && height < 5) {
          width = 100;
          height = 100;
        }

        const newId = `layer-${Math.random().toString(36).substr(2, 9)}`;
        const newLayer = {
          type: canvasState.layerType,
          x,
          y,
          width,
          height,
          fill: lastUsedColor,
          value: "",
        } as RectangleLayer;

        setLayer((prev) => [...prev, { id: newId, layer: newLayer }]);
        startPointRef.current = null;
        setDraftLayer(null);
        setCanvasState({ mode: CanvasMode.None });
      } else if (canvasState.mode === CanvasMode.Resizing || canvasState.mode === CanvasMode.Translating) {
        // I FKIN WROTE THIS LINE YOU FKIN NIII ... YEAHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH!
        setCanvasState({ mode: CanvasMode.None });
      }
      
    },
    [canvasState, clientToWorld, lastUsedColor],
  );

  // WE ARE USING USEMEMO AS THE CALULATIONS ARE HEAVY WHICH WILL LAG THE BROWSER USEMEMO BASICALLY REMEMBERS THE RETURN VALUE
  const selectionBounds = useMemo(() => {
        const selectedLayers = layers.filter(l => selection.includes(l.id));
        if (selectedLayers.length === 0) return null;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        selectedLayers.forEach(({ layer }) => {
            minX = Math.min(minX, layer.x); minY = Math.min(minY, layer.y);
            maxX = Math.max(maxX, layer.x + layer.width); maxY = Math.max(maxY, layer.y + layer.height);
        });
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }, [selection, layers]);

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
        <g
          style={{
            transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
            transformOrigin: "0 0",
          }}
        >
          {/* Draft Layer Preview */}
          {draftLayer && (
            <>
              {draftLayer.layer.type === LayerType.Rectangle && (
                <Rectangle
                  id={draftLayer.id}
                  layer={draftLayer.layer}
                  onPointerDown={() => {}}
                />
              )}
              {draftLayer.layer.type === LayerType.Ellipse && (
                <Ellipse
                  id={draftLayer.id}
                  layer={draftLayer.layer}
                  onPointerDown={() => {}}
                />
              )}
              {draftLayer.layer.type === LayerType.Note && (
                <Note
                  id={draftLayer.id}
                  layer={draftLayer.layer}
                  onPointerDown={() => {}}
                  onValueChange={() => {}}
                />
              )}
            </>
          )}

          {/* Rendered Layers */}
          {layers.map(({ id, layer }) => {
            const onPointerDown = (e: React.PointerEvent) =>  {
              const coords = clientToWorld(e.clientX, e.clientY)
              e.stopPropagation()
              setSelection([id])
              // CURRENT REFERS TO THE CURRENT COORDS OF THE CURSOR IN THE SVG WORLD
              setCanvasState({mode: CanvasMode.Translating, current: {x: coords.x, y: coords.y}})
            }
            if (layer.type === LayerType.Rectangle)
              return (
                <Rectangle
                  key={id}
                  id={id}
                  layer={layer}
                  onPointerDown={onPointerDown}
                />
              );
            if (layer.type === LayerType.Ellipse)
              return (
                <Ellipse
                  key={id}
                  id={id}
                  layer={layer}
                  onPointerDown={onPointerDown}
                />
              );
            if (
              layer.type === LayerType.Note ||
              layer.type === LayerType.Text
            ) {
              const Comp = layer.type === LayerType.Note ? Note : Text;
              return (
                <Comp
                  key={id}
                  id={id}
                  layer={layer}
                  onPointerDown={onPointerDown}
                  onValueChange={(v) => handleValueChange(id, v)}
                />
              );
            }
            return null;
          })}

          <SelectionBox
            bounds={selectionBounds}

            onResizeHandlerPointerDown={(corner, bounds) => {
               resizingBaseLayersRef.current = layers.map(l => ({id: l.id, layer: l.layer})) 

               setCanvasState({
                mode: CanvasMode.Resizing,
                initialBounds: bounds!,
                corner
               })
            }}

            isShowingHandles={selection.length === 1}
          />
        </g>
      </svg>
    </div>
  );
}
