"use client";

import Rectangle from "@/canvasLayers/rectangle";
import { Button } from "@/components/ui/button";
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

  // To this:
  const [draftLayer, setDraftLayer] = useState<{
    id: string;
    layer: Layer;
  } | null>(null);

  const [selection, setSelection] = useState<string[]>([]);

  const [camera, setCamera] = useState<{ x: number; y: number; scale: number }>(
    { x: 0, y: 0, scale: 1 },
  );

  const [lastUsedColor, setLastUsedColor] = useState<Color>({
    r: 252,
    g: 142,
    b: 42,
  });

  const svgRef = useRef<SVGSVGElement>(null);

  const resizingBaselayersRef = useRef<Array<{ id: string; layer: any }>>([]);

  // ZOOM LOGIC
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
      return () => {
        svg.removeEventListener("wheel", onWheel);
      };
    }
  }, []);

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
      prevLayers.map((layerObj) => {
        if (layerObj.id === id) {
          // Return the new object directly inside the map
          return {
            ...layerObj,
            layer: { ...layerObj.layer, value },
          };
        }
        // Return the original if no match
        return layerObj;
      }),
    );
  }, []);

  // Use refs to store mutable values that don't trigger re-renders
  const startPointRef = useRef<Point | null>(null);

  const onPointerUp = useCallback(() => {}, []);

  const onPointerMove = useCallback(
    (e: any) => {
      const coords = clientToWorld(e.clientX, e.clientY);

      if (canvasState.mode === CanvasMode.Translating && selection.length > 0) {
        // Inside onPointerMove, for CanvasMode.Translating:
        const offset = {
          x: coords.x - canvasState.current.x,
          y: coords.y - canvasState.current.y,
        };

        setLayer((prev) => prev.map((item) => {
          if (selection.includes(item.id)) {
            return {
              ...item,
              layer: {
                ...item.layer,
                x: item.layer.x + offset.x,
                y: item.layer.y + offset.y,
              },
            };
          }
          return item;
        }));

        // CRITICAL: Update the 'current' point to the new coords 
        // so the next frame's offset is calculated from here
        setCanvasState((prev) => ({ ...prev, current: coords }));

      } else if (
        canvasState.mode === CanvasMode.Resizing &&
        selection.length > 0
      ) {
        const { initialBounds, corner } = canvasState;

        let newX = initialBounds.x;
        let newY = initialBounds.y;
        let newWidth = initialBounds.width;
        let newHeight = initialBounds.height;

        if ((corner & Side.top) === Side.top) {
          newY = Math.min(coords.y, initialBounds.y + initialBounds.height);
          newHeight = Math.abs(
            initialBounds.y + initialBounds.height - coords.y,
          );
        }
        if ((corner & Side.bottom) === Side.bottom) {
          newHeight = Math.max(0, coords.y - initialBounds.y);
        }
        if ((corner & Side.left) === Side.left) {
          newX = Math.min(coords.x, initialBounds.x + initialBounds.width);
          newWidth = Math.abs(initialBounds.x + initialBounds.width - coords.x);
        }
        if ((corner & Side.right) === Side.right) {
          newWidth = Math.max(0, coords.x - initialBounds.x);
        }

        const scaleX =
          initialBounds.width !== 0 ? newWidth / initialBounds.width : 1;
        const scaleY =
          initialBounds.height !== 0 ? newHeight / initialBounds.height : 1;

        // Inside onPointerMove, for CanvasMode.Resizing:
        const startLayers = resizingBaselayersRef.current;

        setLayer((prev) => {
          const next = prev.map((item) => {
            const startItem = startLayers.find((l) => l.id === item.id);
            if (!startItem || !selection.includes(item.id)) return item;

            return {
              ...item,
              layer: {
                ...item.layer,
                x: newX + (startItem.layer.x - initialBounds.x) * scaleX,
                y: newY + (startItem.layer.y - initialBounds.y) * scaleY,
                width: startItem.layer.width * scaleX,
                height: startItem.layer.height * scaleY,
              }
            };
          });
          return next;
        });

      }
    },
    [clientToWorld],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      // console.log("Canvas State:", canvasState);
      console.log("Layers:", layers);
    }, 5000);
    return () => clearInterval(interval);
  }, [canvasState]);

  const onSvgPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      console.log("DOWN EVENT", e.clientX, e.clientY);
      const coords = clientToWorld(e.clientX, e.clientY);

      if (canvasState.mode === CanvasMode.Inserting) {
        startPointRef.current = coords;
        console.log("start point", startPointRef.current);
      }
    },
    [canvasState, clientToWorld],
  );

  const onSvgPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
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
            fill: lastUsedColor,
          } as Layer,
        });
      } 


    },
    [lastUsedColor, canvasState, clientToWorld],
  );

  const onSvgPointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      console.log("UP EVENT", e.clientX, e.clientY);
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
          width = 100;
          height = 100;
          // todo minus from x and y
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

        // after calculating the XYMH we can just push the new layer
        setLayer((prev) => [...prev, { id: newId, layer: newLayer }]);

        // here we can clear the starting point and draft layer and reset the canvas state to none
        // basically switch to cursor after creating the rectangle
        startPointRef.current = null;
        setDraftLayer(null);
        setCanvasState({ mode: CanvasMode.None });
      }
    },
    [canvasState, clientToWorld, lastUsedColor],
  );

  const onPointerDown = useCallback((e: any, layerId: string) => {
    e.stopPropagation();

    const coords = clientToWorld(e.clientX, e.clientY);

    if (canvasState.mode === CanvasMode.None) {
      if (!selection.includes(layerId)) {
        setSelection([layerId]);
      }
      setCanvasState({ mode: CanvasMode.Translating, current: coords });
    }
  }, [selection, clientToWorld, layers, canvasState]);


  // Selection bound
  const selectionsBounds = useMemo(() => {
    const selectedLayers = layers.filter((l) => selection.includes(l.id));
    if (selectedLayers.length === 0) return null;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    selectedLayers.forEach(({ layer }) => {
      minX = Math.min(minX, layer.x);
      minY = Math.min(minY, layer.y);
      maxX = Math.max(maxX, layer.x + layer.width);
      maxY = Math.max(maxY, layer.y + layer.height);
    });

    return { x: minX, y: minY, width: maxX, height: maxY };
  }, [selection]);

  return (
    <div
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="h-screen w-full relative overflow-hidden bg-amber-100"
    >
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
          {draftLayer &&
            (draftLayer.layer.type === LayerType.Rectangle ? (
              <Rectangle
                id={draftLayer.id}
                key={draftLayer.id}
                layer={draftLayer.layer}
                onPointerDown={(e) => {}}
              />
            ) : draftLayer.layer.type === LayerType.Ellipse ? (
              <Ellipse
                id={draftLayer.id}
                key={draftLayer.id}
                layer={draftLayer.layer}
                onPointerDown={() => {}}
              />
            ) : draftLayer.layer.type === LayerType.Note ? (
              <Note
                id={draftLayer.id}
                key={draftLayer.id}
                layer={draftLayer.layer}
                onPointerDown={() => {}}
                onValueChange={() => {}}
              />
            ) : null)}

          {layers.map(({ id: layerId, layer }) => {
            const selectionColor = selection.includes(layerId)
              ? "transparent"
              : undefined;
            if (layer.type === LayerType.Rectangle) {
              return (
                <Rectangle
                  key={layerId}
                  id={layerId}
                  layer={layer}
                  onPointerDown={(e) => onPointerDown(e, layerId)}
                  selectionColor={selectionColor}
                />
              );
            }

            if (layer.type === LayerType.Ellipse) {
              return (
                <Ellipse
                  key={layerId}
                  id={layerId}
                  layer={layer}
                  onPointerDown={(e) => onPointerDown(e, layerId)}
                  selectionColor={selectionColor}
                />
              );
            }

            if (
              layer.type === LayerType.Note ||
              layer.type === LayerType.Text
            ) {
              const Components = layer.type === LayerType.Note ? Note : Text;
              return (
                <Components
                  key={layerId}
                  id={layerId}
                  layer={layer}
                  onPointerDown={(e) => onPointerDown(e, layerId)}
                  selectionColor={selectionColor}
                  onValueChange={(value) => {
                    handleValueChange(layerId, value);
                  }}
                />
              );
            }
          })}

          <SelectionBox
            bounds={selectionsBounds}
            onResizeHandlerPointerDown={(corner, bounds) => {
              // 1. Capture the current state of all layers to use as a baseline
              resizingBaselayersRef.current = [...layers];

              // 2. Set the state to Resizing mode
              setCanvasState({
                mode: CanvasMode.Resizing,
                initialBounds: bounds!,
                corner,
              });
            }}
            isShowingHandles={selection.length === 1}
          />
        </g>
      </svg>
    </div>
  );
}
