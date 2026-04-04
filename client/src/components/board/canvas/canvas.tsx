"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  CanvasMode,
  CanvasState,
  color,
  layerType,
  NoteLayer,
  Point,
  RectangleLayer,
  Side,
  XYMH,
} from "@/types/canvas";
import { useHistory } from "@/hooks/use-history";
import { connectSocket } from "@/lib/api/websocket-api";

import Info from "../info/info";
import Members from "../members/members";
import Toolbar from "../toolbar/toolbar";
import { CursorPresence } from "../cursor-presence";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { RectangleTool } from "../boardTools/rectangle";
import { SelectionBox } from "../selection-box";
import { Ellipse } from "../boardTools/ellipse";
import {
  ColorToCss,
  duplicateLayer,
  findLayerByPoint,
  throttle,
} from "@/lib/utils";
import { Note } from "../boardTools/note";
import { Text } from "../boardTools/text";
import { Path } from "../boardTools/path";
import { useCursorStore } from "../../../store/use-cursor-store/user-cursor-store";

export default function Canvas({
  id,
  title,
  dirtyLayers,
  save,
}: {
  id: string;
  title: string;
  dirtyLayers: React.MutableRefObject<
    Map<string, { layer: any; status: "update" | "delete" | "create" }>
  >;
  save: () => void;
}) {
  const [canvasState, setCanvasState] = useState<CanvasState>({
    mode: CanvasMode.None,
  });
  const { undo, redo, canUndo, canRedo, saveState, currentState } =
    useHistory();

  const dragStartlayersRef = useRef<Map<string, { x: number; y: number }>>(
    new Map(),
  );
  const router = useRouter();
  const [camera, setCamera] = useState({ x: 0, y: 0, scale: 1 });
  const [lastUsedColor, setLastUsedColor] = useState<color>({
    r: 252,
    g: 142,
    b: 42,
  });

  const { user } = useAuth();

  // const [otherCursors, setOtherCursors] = useState<
  //   Record<string, { x: number; y: number; name: string }>
  // >({});

  const wsRef = useRef<WebSocket | null>(null);
  const lastSentRef = useRef<number>(0);
  const lastSentPencilRef = useRef<number>(0);

  const lastSentMoveRef = useRef(0);

  const [rectangleLayers, setRectangleLayers] = useState<
    Array<{ id: string; layer: any }>
  >([]);
  const [draftRectangleLayer, setDraftRectangleLayer] = useState<{
    id: string;
    layer: any;
  } | null>(null);

  const [othersDraftLayers, setOthersDraftLayers] = useState<
    Record<string, { id: string; layer: any } | null>
  >({});

  const otherDraftlayerRef = useRef(new Map<string, any>())

  const draftElementRef = useRef<SVGSVGElement>(null);

  const [otherPencil, setOtherPencil] = useState<Record<
    string,
    { points: number[][]; color: color }
  > | null>({});

  const translatingBaseLayersRef = useRef<Array<{ id: string; layer: any }>>(
    [],
  );
  const resizingBaseLayersRef = useRef<Array<{ id: string; layer: any }>>([]);

  // Key is ID
  const [selection, setSelection] = useState<string[]>([]);

  const selectionRef = useRef<string[]>([]);
  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const selectionBoxRef = useRef<SVGGElement | null>(null);
  const insertingStartRef = useRef<Point | null>(null);
  const didInitHistoryRef = useRef(false);

  const layerRefs = useRef(new Map<string, any>());
  const updateCursor = useCursorStore((state) => state.updateCursor);

  // 2. When a user moves something (onPointerUp)
  const onLayerChange = useCallback(
    (id: string, newData: any) => {
      dirtyLayers.current.set(id, { layer: newData, status: "update" });
    },
    [dirtyLayers],
  );

  // 3. When a user deletes something
  const onLayerDelete = useCallback(
    (id: string) => {
      dirtyLayers.current.set(id, { layer: null, status: "delete" });
    },
    [dirtyLayers],
  );

  // 2. Throttled Layer Update (Keep this slightly faster, e.g., 30ms, for "live" feel)
  const throttledLayerBroadcast = useMemo(
    () =>
      throttle((layers: any[]) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "LAYER_UPDATE_DELTA",
              content: layers,
              userId: user?.id,
            }),
          );
        }
      }, 16),
    [],
  );

  // --- WEBSOCKET SETUP ---
  useEffect(() => {
    let isCancelled = false;
    const setup = async () => {
      try {
        const { socket, error } = await connectSocket(id);
        if (error !== null) {
          toast({ title: "Error", description: error, variant: "destructive" });
          router.push("/");
          return;
        }
        if (isCancelled) {
          socket.close();
          return;
        }
        wsRef.current = socket;

        socket.onmessage = (event: MessageEvent) => {
          const data = JSON.parse(event.data);

          // Ignore our own echo messages from the server (we already applied them locally)
          if (
            data.userId &&
            user?.id &&
            data.userId === user.id &&
            data.type !== "CURSOR_MOVE"
          ) {
            return;
          }

          // 1. Handle Initial State from Backend
          if (data.type === "init_state") {
            const layers = data.content;
            if (Array.isArray(layers)) {
              setRectangleLayers(layers);
              // Sync history so the user doesn't "undo" into an empty screen
              saveState(JSON.stringify(layers));
            }
          }

          if (data.type === "LAYER_UPDATE_DELTA") {
            const deltaLayers = data.content; // Array of changed layers

            setRectangleLayers((prev) => {
              const next = [...prev];

              deltaLayers.forEach((incomingLayer: any) => {
                const index = next.findIndex((l) => l.id === incomingLayer.id);

                if (index !== -1) {
                  // 1. Update existing layer
                  next[index] = incomingLayer;
                } else {
                  // 2. It's a new layer created by someone else
                  next.push(incomingLayer);
                }
              });

              return next;
            });

            // Clear selection if any updated layer is currently selected
            const updatedIds = deltaLayers.map((l: any) => l.id);
            setSelection((prevSelection) =>
              prevSelection.filter((id) => !updatedIds.includes(id)),
            );
          }

          if (data.type === "LAYER_TRANSFORM") {
            const transformed = data.content;
            setRectangleLayers((prev) => {
              return prev.map((item) => {
                const change = transformed.find(
                  (t: any) => t.layerId === item.id,
                );
                if (!change) return item;
                return {
                  ...item,
                  layer: {
                    ...item.layer,
                    x: change.x,
                    y: change.y,
                    width: change.width,
                    height: change.height,
                  },
                };
              });
            });
          }

          if (data.type === "CREATE_DRAFT") {
            requestAnimationFrame(() => {
              setOthersDraftLayers((prev) => ({
                ...prev,
                [data.userId]: data.content, // null OR layer
              }));
            });
          }

          if (data.type === "DRAFT_UPDATE") {
            const id = `draft-${data.userId}`
            const {x, y, width, height} = data.content
            const node = otherDraftlayerRef.current.get(id)
            
            node.setAttribute("transform", `translate(${x}, ${y})`);

            const tag = node.tagName.toLowerCase();

            if (tag === "rect" || tag === "foreignobject") {
              node.setAttribute("width", width.toString());
              node.setAttribute("height", height.toString());
            } else if (tag === "ellipse") {
              node.setAttribute("cx", (width / 2).toString());
              node.setAttribute("cy", (height / 2).toString());
              node.setAttribute("rx", (width / 2).toString());
              node.setAttribute("ry", (height / 2).toString());
            }
          }

          if (data.type === "DRAFT_PENCIL") {
            requestAnimationFrame(() => {
              setOtherPencil((prev) => ({
                ...prev,
                // when we need to use a var as a key we use [var]
                [data.userId]: data.content,
              }));
            })
          }

          if (data.type === "LAYER_DELETE") {
            const idsToDelete = data.content;

            if (selectionRef.current.some((id) => idsToDelete.includes(id))) {
              setSelection([]);
            }

            setRectangleLayers((prev) =>
              prev.filter((l) => !idsToDelete.includes(l.id)),
            );
          }

          if (data.type === "LAYER_MOVE") {
            const id = data.content.id;
            const node = layerRefs.current.get(id);

            if (selectionRef.current.includes(id)) {
              setSelection([]);
            }

            // All layers now use transform="translate(x, y)" — set it directly.
            // The old attr:{x,y} approach was stacking on top of the transform and causing 700px jumps.
            if (node) {
              const targetTransform = `translate(${data.content.x}, ${data.content.y})`;
              node.setAttribute("transform", targetTransform);
            }
          }

          if (data.type === "LAYER_RESIZE") {
            const resized: {
              id: string;
              x: number;
              y: number;
              width: number;
              height: number;
            }[] = data.content;

            const resizedIds = resized.map((r) => r.id);
            if (selectionRef.current.some((id) => resizedIds.includes(id))) {
              setSelection([]);
            }

            resized.forEach((item) => {
              const node = layerRefs.current.get(item.id);
              if (!node) return;

              const tag = node.tagName.toLowerCase();
              node.setAttribute("transform", `translate(${item.x}, ${item.y})`);

              if (tag === "rect" || tag === "foreignobject") {
                node.setAttribute("width", item.width.toString());
                node.setAttribute("height", item.height.toString());

                if (tag === "foreignobject") {
                  const div = node.querySelector("div");
                  if (div) {
                    div.style.fontSize =
                      Math.min(120, item.height * 0.2) + "px";
                  }
                }
              } else if (tag === "ellipse") {
                node.setAttribute("cx", (item.width / 2).toString());
                node.setAttribute("cy", (item.height / 2).toString());
                node.setAttribute("rx", (item.width / 2).toString());
                node.setAttribute("ry", (item.height / 2).toString());
              }
            });
          }

          if (data.type === "LAYER_CREATE") {
            const newLayer = data.content;
            setRectangleLayers((prev) => [...prev, newLayer]);
          }

          // 2. Handle Real-time Cursors
          if (data.type === "CURSOR_MOVE") {
            updateCursor(data.userId, data.content);
          }
        };
      } catch (err) {
        console.error("Socket setup failed:", err);
      }
    };
    setup();
    return () => {
      isCancelled = true;
      wsRef.current?.close();
    };
  }, [id]);

  // handle before unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyLayers.current.size > 0) {
        const payload = JSON.stringify(
          Array.from(dirtyLayers.current.entries()),
        );
        // sendBeacon is asynchronous and doesn't block the UI/Close
        navigator.sendBeacon(`/api/rooms/save/${id}`, payload);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [rectangleLayers, id]);

  // --- HISTORY SNAPSHOTS ---
  useEffect(() => {
    if (didInitHistoryRef.current) return;
    didInitHistoryRef.current = true;
    saveState(JSON.stringify([]));
  }, [saveState]);

  useEffect(() => {
    if (currentState === undefined) return;
    try {
      const parsed = JSON.parse(currentState);
      if (Array.isArray(parsed)) setRectangleLayers(parsed);
    } catch {
      // Silent fail for malformed history
    } finally {
      insertingStartRef.current = null;
      setDraftRectangleLayer(null);
    }
  }, [currentState]);

  const deleteLayers = useCallback(() => {
    if (selection.length === 0) return;

    // Track every deleted ID in the dirty ref
    selection.forEach((id) => {
      dirtyLayers.current.set(id, { layer: null, status: "delete" });
    });

    const nextLayers = rectangleLayers.filter(
      (layer) => !selection.includes(layer.id),
    );

    wsRef.current?.send(
      JSON.stringify({
        type: "LAYER_DELETE",
        content: selection,
        userId: user?.id,
      }),
    );

    setRectangleLayers(nextLayers);
    saveState(JSON.stringify(nextLayers));
    setSelection([]);
  }, [selection, rectangleLayers, saveState, dirtyLayers]);

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;

      // 1. Don't trigger if user is typing in an input
      if (
        target?.tagName?.toLowerCase() === "input" ||
        target?.tagName?.toLowerCase() === "textarea" ||
        target?.isContentEditable
      )
        return;

      // 2. Handle Delete/Backspace (No Ctrl required)
      if (e.key === "Delete" || e.key === "Backspace") {
        deleteLayers();
        return; // Exit early
      }

      // 3. Handle Ctrl-based shortcuts
      if (!e.ctrlKey && !e.metaKey) return;

      if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        undo();
      }
      if (e.key === "y" || e.key === "Y") {
        e.preventDefault();
        redo();
      }

      if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        if (selection.length === 0) return;

        const dupedLayer = duplicateLayer(selection[0], rectangleLayers);
        if (!dupedLayer) return;

        setRectangleLayers((prev) => [...prev, dupedLayer]);
        setSelection([dupedLayer.id]);

        wsRef.current?.send(
          JSON.stringify({
            type: "LAYER_CREATE",
            content: dupedLayer,
          }),
        );
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo, deleteLayers]);

  // --- CAMERA / ZOOM LOGIC ---
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
    if (!svg) return;
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  const clientToWorld = useCallback(
    (clientX: number, clientY: number) => {
      const bounds = svgRef.current?.getBoundingClientRect();
      return {
        x: (clientX - (bounds?.left ?? 0) - camera.x) / camera.scale,
        y: (clientY - (bounds?.top ?? 0) - camera.y) / camera.scale,
      };
    },
    [camera],
  );

  const eraseLayer = useCallback(
    (layerId: string) => {
      dirtyLayers.current.set(layerId, { layer: null, status: "delete" });

      wsRef?.current?.send(
        JSON.stringify({
          type: "LAYER_DELETE",
          content: [layerId],
          userId: user?.id,
        }),
      );

      setRectangleLayers((prev) => {
        const next = prev.filter((l) => l.id !== layerId);

        saveState(JSON.stringify(next));

        setSelection((selection) => selection.filter((id) => id !== layerId));

        return next;
      });
    },
    [saveState, dirtyLayers],
  );

  // --- POINTER EVENTS ---
  const onSvgPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);

      const coords = clientToWorld(e.clientX, e.clientY);
      if (canvasState.mode === CanvasMode.None) {
        setSelection([]);
        setCanvasState({ mode: CanvasMode.SelectionNet, origin: coords });
      } else if (canvasState.mode === CanvasMode.Pencil) {
        setCanvasState({
          mode: CanvasMode.Pencil,
          pencilPoints: [[coords.x, coords.y, e.pressure || 0.5]],
        });
      }

      // INITIATING THE DRAFT LAYER AND THEN MUTATING IT DIRECTLY USING USEREF DOM
      if (canvasState.mode === CanvasMode.Inserting) {
        insertingStartRef.current = coords;

        const draftId = "draft";

        const draft = {
          id: draftId,
          layer: {
            type: canvasState.layerType,
            x: coords.x,
            y: coords.y,
            width: 0,
            height: 0,
            fill: lastUsedColor,
            value: "Text",
          },
        }

        setDraftRectangleLayer(draft);

        wsRef.current?.send(JSON.stringify({
          type: "CREATE_DRAFT",
          content: draft,
          userId: user?.id
        }))
      }

      if (canvasState.mode === CanvasMode.Eraser) {
        const hitId = findLayerByPoint(coords.x, coords.y, rectangleLayers);
        if (hitId) eraseLayer(hitId);
        return;
      }
    },
    [canvasState, clientToWorld],
  );

  const onSvgPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const coords = clientToWorld(e.clientX, e.clientY);

      // ---- ERASER DRAG ----
      // e.button === 1 means the user is currently holding left-click while moving
      if (canvasState.mode === CanvasMode.Eraser && e.buttons === 1) {
        const hitId = findLayerByPoint(coords.x, coords.y, rectangleLayers);
        if (hitId) eraseLayer(hitId);

        return;
      }

      // FIX: Only update pencil points if we are in Pencil mode AND currently drawing (pencilPoints has data)
      if (
        canvasState.mode === CanvasMode.Pencil &&
        canvasState.pencilPoints &&
        canvasState.pencilPoints.length > 0
      ) {
        setCanvasState((prev) => ({
          ...prev,
          mode: CanvasMode.Pencil,
          pencilPoints: [
            ...(prev as any).pencilPoints,
            [coords.x, coords.y, e.pressure || 0.5],
          ],
        }));

        const now = Date.now();

        if (
          now - lastSentPencilRef.current > 30 &&
          wsRef.current?.readyState === WebSocket.OPEN
        ) {
          lastSentPencilRef.current = now;

          wsRef.current.send(
            JSON.stringify({
              type: "DRAFT_PENCIL",
              content: {
                points: canvasState.pencilPoints,
                color: lastUsedColor,
              },
              userId: user?.id,
            }),
          );
        }
      } else if (
        canvasState.mode === CanvasMode.Inserting &&
        insertingStartRef.current
      ) {
        const start = insertingStartRef.current;
        if (!start) return;
        const draftLayer = {
          id: "draft",
          layer: {
            type: canvasState.layerType,
            x: Math.min(start.x, coords.x),
            y: Math.min(start.y, coords.y),
            width: Math.abs(coords.x - start.x),
            height: Math.abs(coords.y - start.y),
            fill: lastUsedColor,
          },
        };


        const node = draftElementRef.current;
        if (!node) return;

        const x = Math.min(start.x, coords.x);
        const y = Math.min(start.y, coords.y);
        const width = Math.abs(coords.x - start.x);
        const height = Math.abs(coords.y - start.y);

        // IMPORTANT: match how your components render internally

        node.setAttribute("transform", `translate(${x}, ${y})`);

        const tag = node.tagName.toLowerCase();

        if (tag === "rect" || tag === "foreignobject") {
          node.setAttribute("width", width.toString());
          node.setAttribute("height", height.toString());
        } else if (tag === "ellipse") {
          node.setAttribute("cx", (width / 2).toString());
          node.setAttribute("cy", (height / 2).toString());
          node.setAttribute("rx", (width / 2).toString());
          node.setAttribute("ry", (height / 2).toString());
        }

        const now = Date.now();
        if (  now - lastSentMoveRef.current > 30 && wsRef.current?.readyState === WebSocket.OPEN) {
          lastSentMoveRef.current = now;
          wsRef.current?.send(JSON.stringify({
            type: "DRAFT_UPDATE",
            content: {x, y, width, height},
            userId: user?.id
          }))
        }

      }
    },
    [canvasState, clientToWorld, lastUsedColor],
  );

  // --- 1. The SVG Specific Handler ---
  const onSvgPointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const coords = clientToWorld(e.clientX, e.clientY);

      // --- PENCIL FINALIZATION ---
      if (canvasState.mode === CanvasMode.Pencil) {
        if (canvasState.pencilPoints && canvasState.pencilPoints.length > 1) {
          const newId = `path-${Math.random().toString(36).substr(2, 9)}`;
          const newLayer = {
            type: layerType.Path,
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            fill: lastUsedColor,
            points: canvasState.pencilPoints,
          };

          const nextLayers = [
            ...rectangleLayers,
            { id: newId, layer: newLayer },
          ];
          setRectangleLayers(nextLayers);

          // BROADCAST CREATE
          wsRef.current?.send(
            JSON.stringify({
              type: "LAYER_UPDATE_DELTA", // The receiver algo handles "push if not exists"
              content: [{ id: newId, layer: newLayer }],
              userId: user?.id,
            }),
          );

          saveState(JSON.stringify(nextLayers));
          onLayerChange(newId, newLayer);

          setCanvasState({ mode: CanvasMode.Pencil, pencilPoints: [] });
        }
      }

      // --- SHAPE FINALIZATION (Rectangle, Ellipse, Note, Text) ---
      else if (
        canvasState.mode === CanvasMode.Inserting &&
        insertingStartRef.current
      ) {
        const start = insertingStartRef.current;
        let width = Math.abs(coords.x - start.x);
        let height = Math.abs(coords.y - start.y);
        let x = Math.min(start.x, coords.x);
        let y = Math.min(start.y, coords.y);

        if (width < 5 && height < 5) {
          width = 100;
          height = 100;
          x = start.x - 50;
          y = start.y - 50;
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
        };

        const nextLayers = [...rectangleLayers, { id: newId, layer: newLayer }];
        setRectangleLayers(nextLayers);

        // BROADCAST CREATE
        wsRef.current?.send(
          JSON.stringify({
            type: "LAYER_UPDATE_DELTA",
            content: [{ id: newId, layer: newLayer }],
            userId: user?.id,
          }),
        );

        saveState(JSON.stringify(nextLayers));
        onLayerChange(newId, newLayer);

        insertingStartRef.current = null;
        setDraftRectangleLayer(null);

        wsRef?.current?.send(
          JSON.stringify({
            type: "CREATE_DRAFT",
            content: null,
          }),
        );

        setCanvasState({ mode: CanvasMode.None });
      }

      // ... rest of your logic for Translating/Resizing
      else if (
        canvasState.mode === CanvasMode.Translating ||
        canvasState.mode === CanvasMode.Resizing
      ) {
        saveState(JSON.stringify(rectangleLayers));
        setCanvasState({ mode: CanvasMode.None });
      }

      e.currentTarget.releasePointerCapture(e.pointerId);
    },
    [
      canvasState,
      clientToWorld,
      lastUsedColor,
      rectangleLayers,
      saveState,
      onLayerChange,
    ],
  );

  const selectionBounds = useMemo(() => {
    const selectedLayers = rectangleLayers.filter((l) =>
      selection.includes(l.id),
    );
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
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }, [selection, rectangleLayers]);

  const onLayerPointerDown = useCallback(
    (e: React.PointerEvent, layerId: string) => {
      if (canvasState.mode === CanvasMode.Eraser) return;
      // prevent selection if i m erasing
      if (
        canvasState.mode === CanvasMode.Inserting ||
        canvasState.mode === CanvasMode.Pencil
      )
        return;
      e.stopPropagation();
      const coords = clientToWorld(e.clientX, e.clientY);

      translatingBaseLayersRef.current = rectangleLayers.map((l) => ({
        id: l.id,
        layer: { ...l.layer },
      }));

      setSelection(
        e.shiftKey
          ? (prev) =>
              prev.includes(layerId)
                ? prev.filter((id) => id !== layerId)
                : [...prev, layerId]
          : [layerId],
      );
      setCanvasState({ mode: CanvasMode.Translating, current: coords });

      const start = new Map();

      rectangleLayers.forEach((l) => {
        if (selection.includes(l.id) || l.id === layerId) {
          start.set(l.id, { x: l.layer.x, y: l.layer.y });
        }
      });

      dragStartlayersRef.current = start;

      setCanvasState({ mode: CanvasMode.Translating, current: coords });
    },
    [canvasState.mode, clientToWorld, rectangleLayers],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const coords = clientToWorld(e.clientX, e.clientY);

      // --- 1. TRANSLATING LOGIC ---
      if (canvasState.mode === CanvasMode.Translating && selection.length > 0) {
        const offset = {
          x: coords.x - canvasState.current.x,
          y: coords.y - canvasState.current.y,
        };
        const startState = dragStartlayersRef.current;

        let firstMovedLayer: any = null;

        selection.forEach((id) => {
          const startPos = startState.get(id);
          if (!startPos) return;

          const newX = startPos.x + offset.x;
          const newY = startPos.y + offset.y;

          if (!firstMovedLayer) firstMovedLayer = { id, x: newX, y: newY };

          const node = layerRefs.current.get(id);
          if (node) {
            node.setAttribute("transform", `translate(${newX}, ${newY})`);
          }
        });

        if (selectionBoxRef.current) {
          selectionBoxRef.current.setAttribute(
            "transform",
            `translate(${offset.x}, ${offset.y})`,
          );
        }

        const now = Date.now();
        if (
          firstMovedLayer &&
          now - lastSentMoveRef.current > 25 &&
          wsRef.current?.readyState === WebSocket.OPEN
        ) {
          lastSentMoveRef.current = now;
          wsRef.current?.send(
            JSON.stringify({
              type: "LAYER_MOVE",
              content: {
                id: firstMovedLayer.id,
                x: firstMovedLayer.x,
                y: firstMovedLayer.y,
              },
              userId: user?.id,
            }),
          );
        }
        // Notice we DO NOT return here, so that CURSOR BROADCAST at the bottom still runs.
      }

      // --- 2. RESIZING LOGIC (The Fixed Part) ---
      else if (
        canvasState.mode === CanvasMode.Resizing &&
        selection.length > 0
      ) {
        const { initialBounds, corner } = canvasState;

        // Calculate the target bounding box based on mouse position
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

        // Calculate scale factors against the ORIGINAL bounds
        const scaleX =
          initialBounds.width !== 0 ? newWidth / initialBounds.width : 1;
        const scaleY =
          initialBounds.height !== 0 ? newHeight / initialBounds.height : 1;

        const startLayers = resizingBaseLayersRef.current;

        requestAnimationFrame(() => {
          let resizedLayers: any[] = [];

          selection.forEach((id) => {
            const startItem = startLayers.find((l: any) => l.id === id);
            if (!startItem) return;

            const itemNewX =
              newX + (startItem.layer.x - initialBounds.x) * scaleX;
            const itemNewY =
              newY + (startItem.layer.y - initialBounds.y) * scaleY;
            const itemNewW = startItem.layer.width * scaleX;
            const itemNewH = startItem.layer.height * scaleY;

            resizedLayers.push({
              id,
              layer: {
                ...startItem.layer,
                x: itemNewX,
                y: itemNewY,
                width: itemNewW,
                height: itemNewH,
              },
            });

            const node = layerRefs.current.get(id);
            if (node) {
              const tag = node.tagName.toLowerCase();
              node.setAttribute(
                "transform",
                `translate(${itemNewX}, ${itemNewY})`,
              );

              if (tag === "rect" || tag === "foreignobject") {
                node.setAttribute("width", itemNewW.toString());
                node.setAttribute("height", itemNewH.toString());

                if (tag === "foreignobject") {
                  const div = node.querySelector("div");
                  if (div) {
                    div.style.fontSize = Math.min(120, itemNewH * 0.2) + "px";
                  }
                }
              } else if (tag === "ellipse") {
                node.setAttribute("cx", (itemNewW / 2).toString());
                node.setAttribute("cy", (itemNewH / 2).toString());
                node.setAttribute("rx", (itemNewW / 2).toString());
                node.setAttribute("ry", (itemNewH / 2).toString());
              }
            }
          });

          // Update Selection Box dynamically
          if (selectionBoxRef.current) {
            selectionBoxRef.current.style.setProperty("--sel-x", `${newX}px`);
            selectionBoxRef.current.style.setProperty("--sel-y", `${newY}px`);
            selectionBoxRef.current.style.setProperty(
              "--sel-w",
              `${newWidth}px`,
            );
            selectionBoxRef.current.style.setProperty(
              "--sel-h",
              `${newHeight}px`,
            );
          }

          if (resizedLayers.length > 0) {
            const now = Date.now();
            if (
              now - lastSentMoveRef.current > 25 &&
              wsRef.current?.readyState === WebSocket.OPEN
            ) {
              lastSentMoveRef.current = now;
              wsRef.current.send(
                JSON.stringify({
                  type: "LAYER_RESIZE",
                  content: resizedLayers.map((l) => ({
                    id: l.id,
                    x: l.layer.x,
                    y: l.layer.y,
                    width: l.layer.width,
                    height: l.layer.height,
                  })),
                  userId: user?.id,
                }),
              );
            }
          }
        });
      }

      // --- 3. CURSOR BROADCAST ---
      const now = Date.now();
      if (
        now - lastSentRef.current > 30 &&
        wsRef.current?.readyState === WebSocket.OPEN
      ) {
        lastSentRef.current = now;
        wsRef.current.send(
          JSON.stringify({
            type: "CURSOR_MOVE",
            content: {
              x: coords.x,
              y: coords.y,
              name: user?.name || "Amie",
              userId: user?.id,
            },
          }),
        );
      }
    },
    [
      canvasState,
      selection,
      clientToWorld,
      user?.name,
      currentState,
      throttledLayerBroadcast,
    ],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (canvasState.mode === CanvasMode.None) return;

      // Capture moving
      if (canvasState.mode === CanvasMode.Translating) {
        const coords = clientToWorld(e.clientX, e.clientY);
        const offset = {
          x: coords.x - canvasState.current.x,
          y: coords.y - canvasState.current.y,
        };
        const startState = dragStartlayersRef.current;

        const nextLayers = rectangleLayers.map((item) => {
          const startPos = startState.get(item.id);
          if (selection.includes(item.id) && startPos) {
            return {
              ...item,
              layer: {
                ...item.layer,
                x: startPos.x + offset.x,
                y: startPos.y + offset.y,
              },
            };
          }
          return item;
        });

        setRectangleLayers(nextLayers);
        saveState(JSON.stringify(nextLayers));

        // Reset the outer <g> translate and clear any stale CSS vars
        if (selectionBoxRef.current) {
          selectionBoxRef.current.removeAttribute("transform");
          selectionBoxRef.current.style.removeProperty("--sel-x");
          selectionBoxRef.current.style.removeProperty("--sel-y");
          selectionBoxRef.current.style.removeProperty("--sel-w");
          selectionBoxRef.current.style.removeProperty("--sel-h");
        }

        nextLayers.forEach((item) => {
          if (selection.includes(item.id)) {
            dirtyLayers.current.set(item.id, {
              layer: item.layer,
              status: "update",
            });
          }
        });

        const transformPayload = nextLayers
          .filter((l) => selection.includes(l.id))
          .map((l) => ({
            id: l.id,
            layer: l.layer,
          }));

        wsRef.current?.send(
          JSON.stringify({
            type: "LAYER_UPDATE_DELTA",
            content: transformPayload,
            userId: user?.id,
          }),
        );

        translatingBaseLayersRef.current = [];
      }
      // Capture resizing — re-compute final positions from the actual final cursor.
      // rectangleLayers is stale (original) because we used DOM mutations during drag.
      else if (canvasState.mode === CanvasMode.Resizing) {
        const coords = clientToWorld(e.clientX, e.clientY);
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
        const startLayers = resizingBaseLayersRef.current;

        const nextLayers = rectangleLayers.map((item) => {
          if (!selection.includes(item.id)) return item;
          const startItem = startLayers.find((l: any) => l.id === item.id);
          if (!startItem) return item;
          return {
            ...item,
            layer: {
              ...item.layer,
              x: newX + (startItem.layer.x - initialBounds.x) * scaleX,
              y: newY + (startItem.layer.y - initialBounds.y) * scaleY,
              width: startItem.layer.width * scaleX,
              height: startItem.layer.height * scaleY,
            },
          };
        });

        setRectangleLayers(nextLayers);
        saveState(JSON.stringify(nextLayers));

        nextLayers.forEach((item) => {
          if (selection.includes(item.id)) {
            dirtyLayers.current.set(item.id, {
              layer: item.layer,
              status: "update",
            });
          }
        });

        const transformPayload = nextLayers
          .filter((l) => selection.includes(l.id))
          .map((l) => ({ id: l.id, layer: l.layer }));

        wsRef.current?.send(
          JSON.stringify({
            type: "LAYER_UPDATE_DELTA",
            content: transformPayload,
            userId: user?.id,
          }),
        );

        resizingBaseLayersRef.current = [];

        if (selectionBoxRef.current) {
          selectionBoxRef.current.style.removeProperty("--sel-x");
          selectionBoxRef.current.style.removeProperty("--sel-y");
          selectionBoxRef.current.style.removeProperty("--sel-w");
          selectionBoxRef.current.style.removeProperty("--sel-h");
        }
      }

      // Reset UI state but keep the tool selected if it's Pencil or Inserting
      if (
        canvasState.mode !== CanvasMode.Pencil &&
        canvasState.mode !== CanvasMode.Inserting
      ) {
        setCanvasState({ mode: CanvasMode.None });
      }
    },
    [
      canvasState,
      clientToWorld,
      rectangleLayers,
      saveState,
      selection,
      dirtyLayers,
    ],
  );

  const handleValueChange = useCallback(
    (layerId: string, newValue: string) => {
      let updatedLayerObj: any = null;

      const nextLayers = rectangleLayers.map((l) => {
        if (l.id === layerId) {
          updatedLayerObj = { ...l, layer: { ...l.layer, value: newValue } };
          return updatedLayerObj;
        }
        return l;
      });

      setRectangleLayers(nextLayers);

      // BROADCAST TEXT UPDATE
      if (updatedLayerObj && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "LAYER_UPDATE_DELTA",
            content: [updatedLayerObj],
            userId: user?.id,
          }),
        );
      }

      dirtyLayers.current.set(layerId, {
        layer: updatedLayerObj.layer,
        status: "update",
      });
      saveState(JSON.stringify(nextLayers));
    },
    [rectangleLayers, saveState, dirtyLayers],
  );

  const onChangeColor = useCallback(
    (fill: color) => {
      setLastUsedColor(fill);

      // If items are selected, update their color immediately
      if (selection.length > 0) {
        const nextLayers = rectangleLayers.map((item) => {
          if (selection.includes(item.id)) {
            const updatedLayer = { ...item.layer, fill };
            dirtyLayers.current.set(item.id, {
              layer: updatedLayer,
              status: "update",
            });
            wsRef.current?.send(
              JSON.stringify({
                type: "LAYER_UPDATE_DELTA",
                content: [{ id: item.id, layer: updatedLayer }],
                userId: user?.id,
              }),
            );

            return { ...item, layer: updatedLayer };
          }
          return item;
        });
        setRectangleLayers(nextLayers);
        saveState(JSON.stringify(nextLayers));
      }
    },
    [selection, rectangleLayers, saveState, dirtyLayers],
  );

  const strokeColor = `rgb(${lastUsedColor.r}, ${lastUsedColor.g}, ${lastUsedColor.b})`;

  return (
    <main
      className="h-full w-full relative bg-neutral-100 touch-none overflow-hidden"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <Info
        id={id}
        title={title}
        onClick={() => {
          save();
        }}
        dirtyLayers={dirtyLayers}
      />
      <Members id={id} />
      <Toolbar
        canvasState={canvasState}
        setCanvasState={setCanvasState}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        lastUsedColor={lastUsedColor}
        onChangeColor={onChangeColor}
        deleteLayers={deleteLayers}
        canDelete={selection.length > 0}
      />

      <svg
        ref={svgRef}
        className="h-screen w-screen bg-neutral-100 touch-none"
        onPointerDown={onSvgPointerDown}
        onPointerMove={onSvgPointerMove}
        onPointerUp={onSvgPointerUp}
      >
        <g
          style={{
            transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
            transformOrigin: "0 0",
          }}
        >
          {/* 1. Rendering the active draft (Rectangle/Ellipse) */}
          {draftRectangleLayer &&
            (draftRectangleLayer.layer.type === layerType.Ellipse ? (
              <Ellipse
                ref={draftElementRef as any}
                id={draftRectangleLayer.id}
                layer={draftRectangleLayer.layer}
                onPointerDown={() => {}}
                selectionColor={strokeColor}
              />
            ) : draftRectangleLayer.layer.type === layerType.Text ? (
              <Text
                ref={draftElementRef}
                id={draftRectangleLayer.id}
                layer={draftRectangleLayer.layer}
                onPointerDown={() => {}}
                selectionColor={strokeColor}
                onValueChange={() => {}}
              />
            ) : draftRectangleLayer.layer.type === layerType.Note ? (
              <Note
                ref={draftElementRef}
                id={draftRectangleLayer.id}
                layer={draftRectangleLayer.layer}
                onPointerDown={() => {}}
                selectionColor={strokeColor}
                onValueChange={() => {}}
              />
            ) : (
              <RectangleTool
                ref={draftElementRef as any}
                id={draftRectangleLayer.id}
                layer={draftRectangleLayer.layer}
                onPointerDown={() => {}}
                selectionColor={strokeColor}
              />
            ))}

          {/* 2. Rendering all established layers */}
          {rectangleLayers.map(({ id: layerId, layer }) => {
            // Shared props excluding the 'key'
            const selectionColor = selection.includes(layerId)
              ? strokeColor
              : "transparent";

            // Handle specific layer types
            if (layer.type === layerType.Rectangle) {
              return (
                <RectangleTool
                  key={layerId}
                  id={layerId}
                  // el means the actual element if the el has mounted add it to the map
                  ref={(el) => {
                    if (el) layerRefs.current.set(layerId, el);
                    else layerRefs.current.delete(layerId);
                  }}
                  layer={layer}
                  onPointerDown={onLayerPointerDown}
                  selectionColor={selectionColor}
                />
              );
            }

            if (layer.type === layerType.Ellipse) {
              return (
                <Ellipse
                  key={layerId}
                  id={layerId}
                  ref={(el) => {
                    if (el) layerRefs.current.set(layerId, el);
                    else layerRefs.current.delete(layerId);
                  }}
                  layer={layer}
                  onPointerDown={onLayerPointerDown}
                  selectionColor={selectionColor}
                />
              );
            }

            if (
              layer.type === layerType.Note ||
              layer.type === layerType.Text
            ) {
              const Component = layer.type === layerType.Note ? Note : Text;
              return (
                <Component
                  key={layerId}
                  id={layerId}
                  ref={(el: any) => {
                    if (el) layerRefs.current.set(layerId, el);
                    else layerRefs.current.delete(layerId);
                  }}
                  layer={layer}
                  onPointerDown={onLayerPointerDown}
                  selectionColor={selectionColor}
                  onValueChange={(val) => handleValueChange(layerId, val)} // Using the fixed handler
                />
              );
            }

            if (layer.type === layerType.Path) {
              return (
                <Path
                  key={layerId}
                  ref={(el) => {
                    if (el) layerRefs.current.set(layerId, el);
                    else layerRefs.current.delete(layerId);
                  }}
                  points={layer.points}
                  onPointerDown={(e) => onLayerPointerDown(e, layerId)}
                  x={layer.x}
                  y={layer.y}
                  fill={layer.fill ? ColorToCss(layer.fill) : "#000"}
                  stroke={selectionColor}
                />
              );
            }

            return null;
          })}

          {/* 3. Rendering the live pencil stroke */}
          {canvasState.mode === CanvasMode.Pencil &&
            canvasState.pencilPoints && (
              <Path
                points={canvasState.pencilPoints}
                fill={ColorToCss(lastUsedColor)}
                x={0}
                y={0}
              />
            )}

          {/* SHOWING OTHER PENCIL DRAWING */}
          {otherPencil &&
            Object.entries(otherPencil).map(([userId, data], index) => (
              <Path
                key={index}
                points={data.points}
                fill={ColorToCss(data.color)}
                x={0}
                y={0}
              />
            ))}

          <g ref={selectionBoxRef}>
            <SelectionBox
              bounds={selectionBounds}
              onResizeHandlePointerDown={(corner, bounds) => {
                resizingBaseLayersRef.current = rectangleLayers.map((l) => ({
                  id: l.id,
                  layer: { ...l.layer },
                }));
                setCanvasState({
                  mode: CanvasMode.Resizing,
                  initialBounds: bounds, // This MUST be selectionBounds
                  corner,
                });
              }}
              isShowingHandles={selection.length === 1}
              isPath={selection[0]?.charAt(0) === "p"}
              scale={camera.scale}
            />
          </g>

          <CursorPresence />

          {Object.entries(othersDraftLayers).map(([userId, draft]) => {
            if (!draft) return null;

            const { id, layer } = draft;

            const userDraftId = `draft-${userId}`

            if (layer.type === layerType.Ellipse) {
              return (
                <Ellipse
                  key={userId}
                  id={id}
                  ref={(el) => {
                    if (el) {
                      otherDraftlayerRef.current.set(userDraftId, el)
                    } else otherDraftlayerRef.current.delete(userDraftId)
                  }}
                  layer={layer}
                  onPointerDown={() => {}}
                  selectionColor={strokeColor}
                />
              );
            }

            if (layer.type === layerType.Text) {
              return (
                <Text
                  key={userId}
                  id={id}
                  ref={(el) => {
                    if (el) {
                      otherDraftlayerRef.current.set(userDraftId, el)
                    } else otherDraftlayerRef.current.delete(userDraftId)
                  }}
                  layer={layer}
                  onPointerDown={() => {}}
                  selectionColor={strokeColor}
                  onValueChange={() => {}}
                />
              );
            }

            if (layer.type === layerType.Note) {
              return (
                <Note
                  key={userId}
                  id={id}
                  ref={(el) => {
                    if (el) {
                      otherDraftlayerRef.current.set(userDraftId, el)
                    } else otherDraftlayerRef.current.delete(userDraftId)
                  }}
                  layer={layer}
                  onPointerDown={() => {}}
                  selectionColor={strokeColor}
                  onValueChange={() => {}}
                />
              );
            }

            return (
              <RectangleTool
                key={userId}
                id={id}
                ref={(el) => {
                  if (el) {
                    otherDraftlayerRef.current.set(userDraftId, el)
                  } else otherDraftlayerRef.current.delete(userDraftId)
                }}
                layer={layer}
                onPointerDown={() => {}}
                selectionColor={strokeColor}
              />
            );
          })}
        </g>
      </svg>
    </main>
  );
}
