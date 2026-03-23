// app/dashboard/[id]/page.tsx

"use client";

import Toolbar from "@/components/board/toolbar/toolbar";
import React, { useEffect, useMemo, useRef, useState, use } from "react";

type CanvasMode = "Cursor" | "Pencil" | "Circle" | "StickyNote" | "Text" | "None";

type Point = { x: number; y: number };

type Camera = { x: number; y: number; zoom: number };

type LayerType = "pencil" | "circle" | "stickyNote" | "text";

type Layer = {
  id: string;
  type: LayerType;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  points: Point[];
  // Extra fields (required for rendering/editing):
  text?: string;
  pathD?: string; // For pencil: cached SVG path string
};

type CanvasState = {
  mode: CanvasMode;
  activeLayerId: string | null;
};

type LayersSnapshot = Array<[string, Layer]>;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function uid() {
  // Works in modern browsers; falls back if needed.
  return globalThis.crypto?.randomUUID?.() ?? `id_${Math.random().toString(16).slice(2)}`;
}

function clonePoint(p: Point): Point {
  return { x: p.x, y: p.y };
}

function cloneLayer(layer: Layer): Layer {
  return {
    ...layer,
    points: layer.points.map(clonePoint),
  };
}

function serializeLayers(map: Map<string, Layer>): LayersSnapshot {
  return Array.from(map.entries()).map(([id, layer]) => [id, cloneLayer(layer)]);
}

function applySnapshot(snapshot: LayersSnapshot): Map<string, Layer> {
  return new Map(snapshot.map(([id, layer]) => [id, cloneLayer(layer)]));
}

function computeBoundsFromPoints(points: Point[]) {
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = points[0].x;
  let minY = points[0].y;
  let maxX = points[0].x;
  let maxY = points[0].y;

  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  // Small margin so thin strokes remain hittable.
  const margin = 4;
  return {
    x: minX - margin,
    y: minY - margin,
    width: maxX - minX + margin * 2,
    height: maxY - minY + margin * 2,
  };
}

function pointsToPath(points: Point[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  // Lightweight smoothing: quadratic curves through midpoints.
  // This reduces jaggedness without heavy curve fitting.
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    d += ` Q ${p1.x} ${p1.y} ${midX} ${midY}`;
  }

  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

function screenToCanvasWithRect(clientX: number, clientY: number, camera: Camera, rect: DOMRect) {
  // Invert: translate(camera.x, camera.y) scale(camera.zoom)
  return {
    x: (clientX - rect.left - camera.x) / camera.zoom,
    y: (clientY - rect.top - camera.y) / camera.zoom,
  };
}

function hitTestLayers(layers: Map<string, Layer>, p: Point) {
  // Iterate in reverse insertion order so topmost shapes win.
  const entries = Array.from(layers.entries());
  for (let i = entries.length - 1; i >= 0; i--) {
    const layer = entries[i][1];
    const pad = 2;
    const within =
      p.x >= layer.x - pad &&
      p.x <= layer.x + layer.width + pad &&
      p.y >= layer.y - pad &&
      p.y <= layer.y + layer.height + pad;

    if (within) return layer.id;
  }
  return null;
}

function useCanvas() {
  const [canvasState, setCanvasState] = useState<CanvasState>({
    mode: "Pencil",
    activeLayerId: null,
  });

  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const cameraRef = useRef(camera);
  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  const [layers, setLayers] = useState<Map<string, Layer>>(() => new Map());
  const layersRef = useRef(layers);
  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Mandatory signature: maps client/screen pixels into zoomed/panned canvas coordinates.
  const screenToCanvas = (clientX: number, clientY: number, cameraArg: Camera) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return screenToCanvasWithRect(clientX, clientY, cameraArg, rect);
  };

  const [draft, setDraft] = useState<Layer | null>(null);
  const draftRef = useRef<Layer | null>(null);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const spacePressedRef = useRef(false);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spacePressedRef.current = true;
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") spacePressedRef.current = false;
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown as any);
      window.removeEventListener("keyup", onKeyUp as any);
    };
  }, []);

  const interactionRef = useRef<
    | {
        kind: "panning";
        pointerId: number;
        lastClient: Point;
      }
    | {
        kind: "drawing";
        pointerId: number;
      }
    | {
        kind: "none";
      }
  >({ kind: "none" });

  const draftStartCanvasRef = useRef<Point | null>(null);
  const lastPencilCanvasRef = useRef<Point | null>(null);

  const historyPastRef = useRef<LayersSnapshot[]>([]);
  const historyFutureRef = useRef<LayersSnapshot[]>([]);
  const [historyMeta, setHistoryMeta] = useState({ canUndo: false, canRedo: false });

  const pushHistory = (prevLayers: Map<string, Layer>) => {
    historyPastRef.current.push(serializeLayers(prevLayers));
    historyFutureRef.current = [];
    setHistoryMeta({
      canUndo: historyPastRef.current.length > 0,
      canRedo: historyFutureRef.current.length > 0,
    });
  };

  const undo = () => {
    const past = historyPastRef.current;
    if (past.length === 0) return;

    const currentSnapshot = serializeLayers(layersRef.current);
    const prevSnapshot = past.pop()!;
    historyFutureRef.current.push(currentSnapshot);

    const nextLayers = applySnapshot(prevSnapshot);
    setLayers(nextLayers);
    setDraft(null);
    draftRef.current = null;

    setHistoryMeta({
      canUndo: historyPastRef.current.length > 0,
      canRedo: historyFutureRef.current.length > 0,
    });
  };

  const redo = () => {
    const future = historyFutureRef.current;
    if (future.length === 0) return;

    const currentSnapshot = serializeLayers(layersRef.current);
    const nextSnapshot = future.pop()!;
    historyPastRef.current.push(currentSnapshot);

    const nextLayers = applySnapshot(nextSnapshot);
    setLayers(nextLayers);
    setDraft(null);
    draftRef.current = null;

    setHistoryMeta({
      canUndo: historyPastRef.current.length > 0,
      canRedo: historyFutureRef.current.length > 0,
    });
  };

  const commitDraft = () => {
    const d = draftRef.current;
    if (!d) return;
    const prevLayers = layersRef.current;

    pushHistory(prevLayers);

    const next = new Map(prevLayers);
    next.set(d.id, cloneLayer(d));
    setLayers(next);
    setCanvasState((prev) => ({ ...prev, activeLayerId: d.id }));
    setDraft(null);
    draftRef.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    const svg = svgRef.current;
    if (!svg) return;
    e.preventDefault();

    const rect = svg.getBoundingClientRect();
    const current = cameraRef.current;
    const mouseCanvas = screenToCanvasWithRect(e.clientX, e.clientY, current, rect);

    const minZoom = 0.1;
    const maxZoom = 10;

    // Exponential scaling makes zoom feel natural across devices.
    const scale = Math.exp(-e.deltaY * 0.0015);
    const nextZoom = clamp(current.zoom * scale, minZoom, maxZoom);

    // Zoom-at-mouse-pointer keeps the cursor's canvas point stable.
    let nextX = (e.clientX - rect.left) - mouseCanvas.x * nextZoom;
    let nextY = (e.clientY - rect.top) - mouseCanvas.y * nextZoom;

    // Wheel also pans the camera (useful for trackpads/scroll wheels).
    const panScale = 0.4;
    nextX += (-e.deltaX) / nextZoom * panScale;
    nextY += (-e.deltaY) / nextZoom * panScale;

    setCamera({ x: nextX, y: nextY, zoom: nextZoom });
  };

  const beginPanning = (e: React.PointerEvent) => {
    (e.currentTarget as any)?.setPointerCapture?.(e.pointerId);
    interactionRef.current = {
      kind: "panning",
      pointerId: e.pointerId,
      lastClient: { x: e.clientX, y: e.clientY },
    };
  };

  const beginDrawing = (e: React.PointerEvent, initialPoint: Point) => {
    (e.currentTarget as any)?.setPointerCapture?.(e.pointerId);
    interactionRef.current = {
      kind: "drawing",
      pointerId: e.pointerId,
    };

    draftStartCanvasRef.current = initialPoint;
    lastPencilCanvasRef.current = initialPoint;

    const c = cameraRef.current;
    const baseStroke = "#111827"; // near Tailwind gray-900

    const layerCommon = {
      id: uid(),
      x: initialPoint.x,
      y: initialPoint.y,
      width: 0,
      height: 0,
      fill: "transparent",
      points: [initialPoint],
    } satisfies Omit<Layer, "type">;

    if (canvasState.mode === "Pencil") {
      const pathD = pointsToPath([initialPoint]);
      const bounds = computeBoundsFromPoints([initialPoint]);
      const nextDraft: Layer = {
        ...layerCommon,
        type: "pencil",
        fill: "transparent",
        points: [initialPoint],
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        pathD,
        // stroke is implicit in render (cached aesthetic)
      };
      draftRef.current = nextDraft;
      setDraft(nextDraft);
      return;
    }

    if (canvasState.mode === "Circle") {
      const nextDraft: Layer = {
        ...layerCommon,
        type: "circle",
        fill: "transparent",
        points: [],
        x: initialPoint.x,
        y: initialPoint.y,
        width: 0,
        height: 0,
      };
      draftRef.current = nextDraft;
      setDraft(nextDraft);
      return;
    }

    const defaultWpx = canvasState.mode === "StickyNote" ? 220 : 260;
    const defaultHpx = canvasState.mode === "StickyNote" ? 180 : 92;
    const defaultW = defaultWpx / c.zoom;
    const defaultH = defaultHpx / c.zoom;

    const nextDraft: Layer = {
      ...layerCommon,
      type: canvasState.mode === "StickyNote" ? "stickyNote" : "text",
      fill: "transparent",
      points: [],
      text: "",
      x: initialPoint.x,
      y: initialPoint.y,
      width: defaultW,
      height: defaultH,
    };
    draftRef.current = nextDraft;
    setDraft(nextDraft);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return;
    e.preventDefault();

    const current = cameraRef.current;
    const canvasPoint = screenToCanvas(e.clientX, e.clientY, current);

    const wantsPan = spacePressedRef.current || e.button === 1;
    if (wantsPan) {
      beginPanning(e);
      return;
    }

    if (canvasState.mode === "Cursor") {
      const hitId = hitTestLayers(layersRef.current, canvasPoint);
      setCanvasState((prev) => ({ ...prev, activeLayerId: hitId }));
      return;
    }

    // Start drawing (Pencil/Circle/Text/StickyNote).
    beginDrawing(e, canvasPoint);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const interaction = interactionRef.current;
    if (interaction.kind === "none") return;
    if (interaction.pointerId !== e.pointerId) return;

    const svg = svgRef.current;
    if (!svg) return;
    const current = cameraRef.current;
    const canvasPoint = screenToCanvas(e.clientX, e.clientY, current);

    if (interaction.kind === "panning") {
      const dx = e.clientX - interaction.lastClient.x;
      const dy = e.clientY - interaction.lastClient.y;
      interactionRef.current = {
        ...interaction,
        lastClient: { x: e.clientX, y: e.clientY },
      };

      setCamera((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      return;
    }

    if (interaction.kind === "drawing") {
      const start = draftStartCanvasRef.current;
      if (!start) return;

      const d = draftRef.current;
      if (!d) return;

      if (d.type === "pencil") {
        const last = lastPencilCanvasRef.current ?? start;
        const minClientDist = 2.2;
        const minCanvasDist = minClientDist / current.zoom;
        const dist = Math.hypot(canvasPoint.x - last.x, canvasPoint.y - last.y);
        if (dist < minCanvasDist) return;

        const nextPoints = [...d.points, canvasPoint];
        const nextBounds = computeBoundsFromPoints(nextPoints);
        const nextPathD = pointsToPath(nextPoints);

        lastPencilCanvasRef.current = canvasPoint;

        const nextDraft: Layer = {
          ...d,
          points: nextPoints,
          x: nextBounds.x,
          y: nextBounds.y,
          width: nextBounds.width,
          height: nextBounds.height,
          pathD: nextPathD,
        };
        draftRef.current = nextDraft;
        setDraft(nextDraft);
        return;
      }

      if (d.type === "circle") {
        const x1 = start.x;
        const y1 = start.y;
        const x2 = canvasPoint.x;
        const y2 = canvasPoint.y;

        const x = Math.min(x1, x2);
        const y = Math.min(y1, y2);
        const width = Math.abs(x2 - x1);
        const height = Math.abs(y2 - y1);

        const nextDraft: Layer = { ...d, x, y, width, height };
        draftRef.current = nextDraft;
        setDraft(nextDraft);
        return;
      }

      // Text / StickyNote: resize from the drag rect, keeping a minimum size.
      const x1 = start.x;
      const y1 = start.y;
      const x2 = canvasPoint.x;
      const y2 = canvasPoint.y;

      const x = Math.min(x1, x2);
      const y = Math.min(y1, y2);
      const widthRaw = Math.abs(x2 - x1);
      const heightRaw = Math.abs(y2 - y1);

      const minWpx = d.type === "stickyNote" ? 140 : 180;
      const minHpx = d.type === "stickyNote" ? 120 : 56;
      const minW = minWpx / current.zoom;
      const minH = minHpx / current.zoom;

      const width = Math.max(widthRaw, minW);
      const height = Math.max(heightRaw, minH);

      const nextDraft: Layer = { ...d, x, y, width, height };
      draftRef.current = nextDraft;
      setDraft(nextDraft);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const interaction = interactionRef.current;
    if (interaction.kind === "none") return;
    if (interaction.pointerId !== e.pointerId) return;

    interactionRef.current = { kind: "none" };
    draftStartCanvasRef.current = null;
    lastPencilCanvasRef.current = null;

    const d = draftRef.current;
    if (!d) return;

    // Basic minimum-size filtering.
    if (d.type === "circle") {
      const minCanvas = 6 / cameraRef.current.zoom;
      if (d.width < minCanvas || d.height < minCanvas) {
        setDraft(null);
        draftRef.current = null;
        return;
      }
    }

    if (d.type === "pencil") {
      if (d.points.length < 2) {
        setDraft(null);
        draftRef.current = null;
        return;
      }
    }

    commitDraft();
  };

  const onPointerCancel = () => {
    interactionRef.current = { kind: "none" };
    setDraft(null);
    draftRef.current = null;
    draftStartCanvasRef.current = null;
    lastPencilCanvasRef.current = null;
  };

  const editSessionRef = useRef<{ layerId: string; pushed: boolean } | null>(null);

  const startTextEditSession = (layerId: string) => {
    editSessionRef.current = { layerId, pushed: false };
  };

  const pushTextEditHistoryIfNeeded = () => {
    const session = editSessionRef.current;
    if (!session || session.pushed) return;
    pushHistory(layersRef.current);
    session.pushed = true;
  };

  const updateLayerText = (layerId: string, nextText: string) => {
    pushTextEditHistoryIfNeeded();

    const prevLayers = layersRef.current;
    const layer = prevLayers.get(layerId);
    if (!layer) return;

    const nextLayer: Layer = { ...layer, text: nextText };
    const next = new Map(prevLayers);
    next.set(layerId, nextLayer);
    setLayers(next);
  };

  const activeLayer = useMemo(() => {
    if (!canvasState.activeLayerId) return null;
    return layers.get(canvasState.activeLayerId) ?? null;
  }, [canvasState.activeLayerId, layers]);

  const layersForRender = useMemo(() => Array.from(layers.entries()), [layers]);

  return {
    svgRef,
    camera,
    layers: layersForRender,
    draft,
    canvasState,
    setCanvasState,
    activeLayer,
    canUndo: historyMeta.canUndo,
    canRedo: historyMeta.canRedo,
    undo,
    redo,
    screenToCanvas: (clientX: number, clientY: number) => screenToCanvas(clientX, clientY, cameraRef.current),
    handlers: {
      onWheel,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
    bgPatternId: "lair-grid",
    updateLayerText,
    startTextEditSession,
    endTextEditSession: () => {
      editSessionRef.current = null;
    },
  };
}

type CanvasProps = {
  svgRef: React.RefObject<SVGSVGElement | null>;
  camera: Camera;
  layers: Array<[string, Layer]>;
  draft: Layer | null;
  canvasState: CanvasState;
  activeLayer: Layer | null;
  handlers: {
    onWheel: (e: React.WheelEvent) => void;
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: () => void;
  };
  bgPatternId: string;
  updateLayerText: (layerId: string, nextText: string) => void;
  startTextEditSession: (layerId: string) => void;
  endTextEditSession: () => void;
};

function Canvas(props: CanvasProps) {
  const {
    svgRef,
    camera,
    layers,
    draft,
    canvasState,
    activeLayer,
    updateLayerText,
    startTextEditSession,
    endTextEditSession,
    handlers,
    bgPatternId,
  } = props;

  return (
    <div className="absolute inset-0 z-0">
      <svg
        ref={svgRef}
        width="100vw"
        height="100vh"
        className="w-full h-full touch-none"
        style={{ touchAction: "none" }}
        onWheel={handlers.onWheel}
        onPointerDown={handlers.onPointerDown}
        onPointerMove={handlers.onPointerMove}
        onPointerUp={handlers.onPointerUp}
        onPointerCancel={handlers.onPointerCancel}
        onContextMenu={(e) => e.preventDefault()}
      >
        <defs>
          <pattern id={bgPatternId} patternUnits="userSpaceOnUse" width={24} height={24}>
            <circle cx={1.5} cy={1.5} r={0.6} fill="#e5e7eb" shapeRendering="crispEdges" />
          </pattern>
        </defs>

        <g transform={`translate(${camera.x}, ${camera.y}) scale(${camera.zoom})`}>
          <rect
            x={-50000}
            y={-50000}
            width={100000}
            height={100000}
            fill={`url(#${bgPatternId})`}
            pointerEvents="none"
          />

          {/* Committed layers */}
          {layers.map(([id, layer]) => {
            const isActive = activeLayer?.id === id;
            const stroke = isActive ? "#2563eb" : "#111827";
            const strokeWidth = 2;

            if (layer.type === "pencil") {
              return (
                <g key={id} pointerEvents="none">
                  {isActive && (
                    <rect
                      x={layer.x}
                      y={layer.y}
                      width={layer.width}
                      height={layer.height}
                      fill="transparent"
                      stroke={stroke}
                      strokeWidth={1.25}
                      vectorEffect="non-scaling-stroke"
                      shapeRendering="crispEdges"
                    />
                  )}
                  <path
                    d={layer.pathD ?? ""}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pointerEvents="none"
                  />
                </g>
              );
            }

            if (layer.type === "circle") {
              const cx = layer.x + layer.width / 2;
              const cy = layer.y + layer.height / 2;
              const rx = Math.max(layer.width / 2, 0);
              const ry = Math.max(layer.height / 2, 0);
              return (
                <g key={id} pointerEvents="none">
                  {isActive && (
                    <rect
                      x={layer.x}
                      y={layer.y}
                      width={layer.width}
                      height={layer.height}
                      fill="transparent"
                      stroke={stroke}
                      strokeWidth={1.25}
                      vectorEffect="non-scaling-stroke"
                      shapeRendering="crispEdges"
                    />
                  )}
                  <ellipse
                    cx={cx}
                    cy={cy}
                    rx={rx}
                    ry={ry}
                    fill="transparent"
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    vectorEffect="non-scaling-stroke"
                    pointerEvents="none"
                  />
                </g>
              );
            }

            if (layer.type === "stickyNote" || layer.type === "text") {
              const isNote = layer.type === "stickyNote";
              const bg = isNote ? "bg-yellow-200/90" : "bg-white/80";
              const border = isNote ? "border-yellow-300" : "border-gray-300";
              const textColor = isNote ? "text-gray-900" : "text-gray-900";

              return (
                <g key={id}>
                  {/* Pointer events must be enabled for editing UI */}
                  <foreignObject x={layer.x} y={layer.y} width={Math.max(layer.width, 10)} height={Math.max(layer.height, 10)}>
                    <div
                      className={`h-full w-full ${bg} ${border} rounded-md shadow-sm border outline-none ${textColor}`}
                      style={{ pointerEvents: canvasState.mode === "Cursor" ? "auto" : "auto", overflow: "hidden" }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                      }}
                      onPointerUp={(e) => e.stopPropagation()}
                      onFocus={() => startTextEditSession(id)}
                      onBlur={() => {
                        endTextEditSession();
                      }}
                    >
                      <textarea
                        className="w-full h-full bg-transparent resize-none outline-none p-3 text-sm leading-5"
                        value={layer.text ?? ""}
                        placeholder={isNote ? "Sticky..." : "Type..."}
                        onPointerDown={(e) => e.stopPropagation()}
                        onChange={(e) => updateLayerText(id, e.target.value)}
                        onFocus={() => startTextEditSession(id)}
                        onBlur={() => endTextEditSession()}
                        spellCheck={false}
                      />
                    </div>
                  </foreignObject>
                  {isActive && (
                    <rect
                      x={layer.x}
                      y={layer.y}
                      width={layer.width}
                      height={layer.height}
                      fill="transparent"
                      stroke={stroke}
                      strokeWidth={1.25}
                      vectorEffect="non-scaling-stroke"
                      shapeRendering="crispEdges"
                    />
                  )}
                </g>
              );
            }

            return null;
          })}

          {/* Draft preview */}
          {draft && (
            <g pointerEvents="none">
              {draft.type === "pencil" && (
                <path
                  d={draft.pathD ?? ""}
                  fill="none"
                  stroke="#111827"
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {draft.type === "circle" && (
                <ellipse
                  cx={draft.x + draft.width / 2}
                  cy={draft.y + draft.height / 2}
                  rx={Math.max(draft.width / 2, 0)}
                  ry={Math.max(draft.height / 2, 0)}
                  fill="transparent"
                  stroke="#111827"
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                />
              )}
              {(draft.type === "stickyNote" || draft.type === "text") && (
                <foreignObject x={draft.x} y={draft.y} width={Math.max(draft.width, 10)} height={Math.max(draft.height, 10)}>
                  <div
                    className={`h-full w-full ${draft.type === "stickyNote" ? "bg-yellow-200/90 border-yellow-300" : "bg-white/80 border-gray-300"} rounded-md border shadow-sm`}
                    style={{ overflow: "hidden" }}
                  />
                </foreignObject>
              )}
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}

function Board({ boardId }: { boardId: string }) {
  const canvas = useCanvas();

  // Toolbar integration: the existing toolbar currently ignores these props,
  // but we still wire it up so it will work when the toolbar is updated.
  const ToolbarAny = Toolbar as unknown as React.ComponentType<any>;

  return (
    <div
      className="h-screen w-screen relative overflow-hidden bg-neutral-100 touch-none"
      data-board-id={boardId}
    >
      <Canvas
        svgRef={canvas.svgRef}
        camera={canvas.camera}
        layers={canvas.layers}
        draft={canvas.draft}
        canvasState={canvas.canvasState}
        activeLayer={canvas.activeLayer}
        handlers={canvas.handlers}
        bgPatternId={canvas.bgPatternId}
        updateLayerText={canvas.updateLayerText}
        startTextEditSession={canvas.startTextEditSession}
        endTextEditSession={canvas.endTextEditSession}
      />

      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="pointer-events-auto">
          <ToolbarAny
            canvasState={canvas.canvasState}
            setCanvasState={canvas.setCanvasState}
            canUndo={canvas.canUndo}
            canRedo={canvas.canRedo}
            undo={canvas.undo}
            redo={canvas.redo}
          />
        </div>
      </div>
    </div>
  );
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <Board boardId={id} />;
}