"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { CanvasMode, CanvasState, color, layerType, NoteLayer, Point, RectangleLayer, Side, XYMH } from "@/types/canvas";
import { useHistory } from "@/hooks/use-history";
import { connectSocket } from "@/lib/api/websocket-api";

import Info from "../info/info";
import Members from "../members/members";
import Toolbar from "../toolbar/toolbar";
import { CursorPresence } from "../cursor-presence";
import { useAuth } from "@/providers/auth-provider";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Rectangle as RectangleTool } from "../boardTools/rectangle";
import { SelectionBox } from "../selection-box";
import { Ellipse } from "../boardTools/ellipse";
import { ColorToCss, throttle } from "@/lib/utils";
import { Note } from "../boardTools/note";
import { Text } from "../boardTools/text";
import { Path } from "../boardTools/path";
import API from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";

export default function Canvas({ id, title, dirtyLayers, save }: { id: string, title: string, dirtyLayers: React.MutableRefObject<Map<string, { layer: any, status: 'update' | 'delete' | 'create' }>>, save: () => void }) {
    const [canvasState, setCanvasState] = useState<CanvasState>({ mode: CanvasMode.None });
    const { undo, redo, canUndo, canRedo, saveState, currentState } = useHistory();

    const router = useRouter();
    const [camera, setCamera] = useState({ x: 0, y: 0, scale: 1 });
    const [lastUsedColor, setLastUsedColor] = useState<color>({ r: 252, g: 142, b: 42 })

    const { user } = useAuth();
    const [otherCursors, setOtherCursors] = useState<Record<string, { x: number, y: number, name: string }>>({});
    const wsRef = useRef<WebSocket | null>(null);
    const lastSentRef = useRef<number>(0);

    const [rectangleLayers, setRectangleLayers] = useState<Array<{ id: string; layer: any }>>([]);
    const [draftRectangleLayer, setDraftRectangleLayer] = useState<{ id: string; layer: any } | null>(null);

    // Key is ID, Value is { layer, status }
    
    const [selection, setSelection] = useState<string[]>([]);
    
    const svgRef = useRef<SVGSVGElement | null>(null);
    const insertingStartRef = useRef<Point | null>(null);
    const rectIdCounterRef = useRef(0);
    const didInitHistoryRef = useRef(false);
    
    const isDirty = useRef(false)

    // 2. When a user moves something (onPointerUp)
    const onLayerChange = useCallback((id: string, newData: any) => {
        dirtyLayers.current.set(id, { layer: newData, status: 'update' });
    }, [dirtyLayers])

    // 3. When a user deletes something
    const onLayerDelete = useCallback((id: string) => {
        dirtyLayers.current.set(id, { layer: null, status: 'delete' });
    }, [dirtyLayers])

    // 1. Throttled Cursor Broadcast (50ms is standard for smooth cursors)
    const throttledCursorMove = useMemo(
    () =>
        throttle((x: number, y: number, name: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
            JSON.stringify({
                type: "CURSOR_MOVE",
                content: { x, y, name },
            })
            );
        }
        }, 50),
    []
    );

    // 2. Throttled Layer Update (Keep this slightly faster, e.g., 30ms, for "live" feel)
    const throttledLayerBroadcast = useMemo(
    () =>
        throttle((layers: any[]) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
            JSON.stringify({
                type: "LAYER_UPDATE",
                content: layers,
            })
            );
        }
        }, 30),
    []
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
                if (isCancelled) { socket.close(); return; }
                wsRef.current = socket;

                socket.onmessage = (event: MessageEvent) => {
                    const data = JSON.parse(event.data);

                    // 1. Handle Initial State from Backend
                    if (data.type === "init_state") {
                        const layers = data.content; 
                        if (Array.isArray(layers)) {
                            console.log(layers)
                            setRectangleLayers(layers);
                            // Sync history so the user doesn't "undo" into an empty screen
                            saveState(JSON.stringify(layers));
                            
                            // Update our counter so new IDs don't collide
                            const maxId = layers.reduce((max, l) => {
                                const num = parseInt(l.id.replace(/^\D+/g, ''));
                                return isNaN(num) ? max : Math.max(max, num);
                            }, 0);
                            rectIdCounterRef.current = maxId + 1;
                        }
                    }

                    // 2. Handle Real-time Cursors
                    if (data.type === "CURSOR_MOVE") {
                        setOtherCursors((prev) => ({
                            ...prev,
                            [data.userId]: data.content
                        }));
                    }
                };
            } catch (err) { 
                console.error("Socket setup failed:", err); 
            }
        };
        setup();
        return () => { isCancelled = true; wsRef.current?.close(); };
    }, [id]); 

    // handle before unload
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (dirtyLayers.current.size > 0) {
                const payload = JSON.stringify(Array.from(dirtyLayers.current.entries()));
                // sendBeacon is asynchronous and doesn't block the UI/Close
                navigator.sendBeacon(`/api/rooms/${id}/save-batch`, payload);
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
        selection.forEach(id => {
            dirtyLayers.current.set(id, { layer: null, status: 'delete' });
        });

        const nextLayers = rectangleLayers.filter(
            (layer) => !selection.includes(layer.id)
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
        ) return;

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

    const clientToWorld = useCallback((clientX: number, clientY: number) => {
        const bounds = svgRef.current?.getBoundingClientRect();
        return {
            x: (clientX - (bounds?.left ?? 0) - camera.x) / camera.scale,
            y: (clientY - (bounds?.top ?? 0) - camera.y) / camera.scale,
        };
    }, [camera]);

    // --- POINTER EVENTS ---
    const onSvgPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId); 
    
        const coords = clientToWorld(e.clientX, e.clientY);
        if (canvasState.mode === CanvasMode.Inserting) {
            insertingStartRef.current = coords;
        } else if (canvasState.mode === CanvasMode.None) {
            setSelection([]);
            setCanvasState({ mode: CanvasMode.SelectionNet, origin: coords });
        } else if (canvasState.mode === CanvasMode.Pencil) {
            setCanvasState({
                mode: CanvasMode.Pencil,
                pencilPoints: [[coords.x, coords.y, e.pressure || 0.5]],
            });
        }
    }, [canvasState, clientToWorld]);

    const onSvgPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
        const coords = clientToWorld(e.clientX, e.clientY);

        // FIX: Only update pencil points if we are in Pencil mode AND currently drawing (pencilPoints has data)
        if (canvasState.mode === CanvasMode.Pencil && canvasState.pencilPoints && canvasState.pencilPoints.length > 0) {
            setCanvasState((prev) => ({
                ...prev,
                mode: CanvasMode.Pencil,
                pencilPoints: [...(prev as any).pencilPoints, [coords.x, coords.y, e.pressure || 0.5]],
            }));
        } else if (canvasState.mode === CanvasMode.Inserting && insertingStartRef.current) {
            const start = insertingStartRef.current;
            setDraftRectangleLayer({
                id: "draft",
                layer: {
                    type: canvasState.layerType,
                    x: Math.min(start.x, coords.x),
                    y: Math.min(start.y, coords.y),
                    width: Math.abs(coords.x - start.x),
                    height: Math.abs(coords.y - start.y),
                    fill: lastUsedColor,
                },
            });
        }
    }, [canvasState, clientToWorld, lastUsedColor]);

    
    // --- 1. The SVG Specific Handler ---
    const onSvgPointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
        const coords = clientToWorld(e.clientX, e.clientY);

        // --- PENCIL FINALIZATION ---
        if (canvasState.mode === CanvasMode.Pencil) {
            if (canvasState.pencilPoints && canvasState.pencilPoints.length > 1) {
                const newId = `path-${rectIdCounterRef.current++}`;
                const newLayer = {
                    type: layerType.Path,
                    x: 0, y: 0, width: 0, height: 0,
                    fill: lastUsedColor,
                    points: canvasState.pencilPoints,
                };
                
                const nextLayers = [...rectangleLayers, { id: newId, layer: newLayer }];
                setRectangleLayers(nextLayers);
                saveState(JSON.stringify(nextLayers));

                // SYNC TO DIRTY:
                onLayerChange(newId, newLayer); 

                setCanvasState({
                    mode: CanvasMode.Pencil,
                    pencilPoints: []
                })
            }
        }

        // --- SHAPE FINALIZATION ---
        else if (canvasState.mode === CanvasMode.Inserting && insertingStartRef.current) {
            const start = insertingStartRef.current;
            let width = Math.abs(coords.x - start.x);
            let height = Math.abs(coords.y - start.y);
            let x = Math.min(start.x, coords.x);
            let y = Math.min(start.y, coords.y);

            if (width < 5 && height < 5) {
                width = 100; height = 100;
                x = start.x - 50; y = start.y - 50;
            }

            const newId = `layer-${rectIdCounterRef.current++}`;
            const newLayer = { type: canvasState.layerType, x, y, width, height, fill: lastUsedColor, value: "" };
            
            const nextLayers = [...rectangleLayers, { id: newId, layer: newLayer }];
            setRectangleLayers(nextLayers);
            saveState(JSON.stringify(nextLayers));

            // SYNC TO DIRTY:
            onLayerChange(newId, newLayer);
            
            insertingStartRef.current = null;
            setDraftRectangleLayer(null);
            setCanvasState({ mode: CanvasMode.None });
        }
        
        // --- TRANSLATING / RESIZING FINALIZATION ---
        else if (canvasState.mode === CanvasMode.Translating || canvasState.mode === CanvasMode.Resizing) {
            saveState(JSON.stringify(rectangleLayers));
            setCanvasState({ mode: CanvasMode.None });
        }

        // --- SELECTION NET FINALIZATION ---
        else {
            setCanvasState({ mode: CanvasMode.None });
        }

        // Release pointer capture
        e.currentTarget.releasePointerCapture(e.pointerId);
    }, [canvasState, clientToWorld, lastUsedColor, rectangleLayers, saveState]);


    
    const selectionBounds = useMemo(() => {
        const selectedLayers = rectangleLayers.filter(l => selection.includes(l.id));
        if (selectedLayers.length === 0) return null;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        selectedLayers.forEach(({ layer }) => {
            minX = Math.min(minX, layer.x); minY = Math.min(minY, layer.y);
            maxX = Math.max(maxX, layer.x + layer.width); maxY = Math.max(maxY, layer.y + layer.height);
        });
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }, [selection, rectangleLayers]);

    const onLayerPointerDown = useCallback((e: React.PointerEvent, layerId: string) => {
        if (canvasState.mode === CanvasMode.Inserting || canvasState.mode === CanvasMode.Pencil) return;
        e.stopPropagation();
        const coords = clientToWorld(e.clientX, e.clientY);
        setSelection(e.shiftKey ? (prev => prev.includes(layerId) ? prev.filter(id => id !== layerId) : [...prev, layerId]) : [layerId]);
        setCanvasState({ mode: CanvasMode.Translating, current: coords });
    }, [canvasState.mode, clientToWorld]);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        const coords = clientToWorld(e.clientX, e.clientY);
        if (canvasState.mode === CanvasMode.Resizing && selection.length === 1) {
            const { initialBounds, corner } = canvasState;
            setRectangleLayers((prev) => prev.map((item) => {
                if (item.id === selection[0]) {
                    let { x, y, width, height } = initialBounds;
                    if ((corner & Side.top) === Side.top) { y = Math.min(coords.y, initialBounds.y + initialBounds.height); height = Math.abs(initialBounds.y + initialBounds.height - coords.y); }
                    if ((corner & Side.bottom) === Side.bottom) { y = Math.min(coords.y, initialBounds.y); height = Math.abs(coords.y - initialBounds.y); }
                    if ((corner & Side.left) === Side.left) { x = Math.min(coords.x, initialBounds.x + initialBounds.width); width = Math.abs(initialBounds.x + initialBounds.width - coords.x); }
                    if ((corner & Side.right) === Side.right) { x = Math.min(coords.x, initialBounds.x); width = Math.abs(coords.x - initialBounds.x); }
                    return { ...item, layer: { ...item.layer, x, y, width, height } };
                }
                return item;
            }));
        } else if (canvasState.mode === CanvasMode.Translating && selection.length > 0) {
            const offset = { x: coords.x - canvasState.current.x, y: coords.y - canvasState.current.y };
            setRectangleLayers((prev) => prev.map((item) => selection.includes(item.id) ? { ...item, layer: { ...item.layer, x: item.layer.x + offset.x, y: item.layer.y + offset.y } } : item));
            setCanvasState({ mode: CanvasMode.Translating, current: coords });
        }

        const now = Date.now();
        if (now - lastSentRef.current > 30 && wsRef.current?.readyState === WebSocket.OPEN) {
            lastSentRef.current = now;
            wsRef.current.send(JSON.stringify({ type: "CURSOR_MOVE", content: { x: Math.round(e.clientX), y: Math.round(e.clientY), name: user?.name || "Anonymous" } }));
        }
    }, [canvasState, selection, clientToWorld, user?.name]);

    const onPointerUp = useCallback(() => {
        if (canvasState.mode === CanvasMode.None) return;

        // Capture moving or resizing
        if (canvasState.mode === CanvasMode.Resizing || canvasState.mode === CanvasMode.Translating) {
            saveState(JSON.stringify(rectangleLayers));
            
            // Sync the final state of selected layers to the dirty ref
            rectangleLayers.forEach((item) => {
                if (selection.includes(item.id)) {
                    dirtyLayers.current.set(item.id, { 
                        layer: item.layer, 
                        status: 'update' 
                    });
                }
            });
        }

        // Reset UI state but keep the tool selected if it's Pencil or Inserting
        if (
            canvasState.mode !== CanvasMode.Pencil && 
            canvasState.mode !== CanvasMode.Inserting
        ) {
            setCanvasState({ mode: CanvasMode.None });
        }
    }, [canvasState.mode, rectangleLayers, saveState, selection, dirtyLayers]);

    const handleValueChange = useCallback((layerId: string, newValue: string) => {
        const nextLayers = rectangleLayers.map((l) => {
            if (l.id === layerId) {
                const updated = { ...l, layer: { ...l.layer, value: newValue } };
                // Sync to dirtyLayers immediately on text change
                dirtyLayers.current.set(layerId, { layer: updated.layer, status: 'update' });
                return updated;
            }
            return l;
        });
        setRectangleLayers(nextLayers);
        saveState(JSON.stringify(nextLayers));
    }, [rectangleLayers, saveState, dirtyLayers]);

    const onChangeColor = useCallback((fill: color) => {
        setLastUsedColor(fill);
        
        // If items are selected, update their color immediately
        if (selection.length > 0) {
            const nextLayers = rectangleLayers.map((item) => {
                if (selection.includes(item.id)) {
                    const updatedLayer = { ...item.layer, fill };
                    dirtyLayers.current.set(item.id, { layer: updatedLayer, status: 'update' });
                    return { ...item, layer: updatedLayer };
                }
                return item;
            });
            setRectangleLayers(nextLayers);
            saveState(JSON.stringify(nextLayers));
        }
    }, [selection, rectangleLayers, saveState, dirtyLayers]);

    const strokeColor = `rgb(${lastUsedColor.r}, ${lastUsedColor.g}, ${lastUsedColor.b})`;

    useEffect(() => {
        console.log(rectangleLayers)
    }, [])


    return (
        <main 
            className="h-full w-full relative bg-neutral-100 touch-none overflow-hidden" 
            onPointerMove={onPointerMove} 
            onPointerUp={onPointerUp}
        >   
            <Info id={id} title={title} onClick={() => {save()}} />
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
                <g style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`, transformOrigin: "0 0" }}>
                    
                    {/* 1. Rendering the active draft (Rectangle/Ellipse) */}
                    {draftRectangleLayer && (
                        draftRectangleLayer.layer.type === layerType.Ellipse ? (
                            <Ellipse 
                                id={draftRectangleLayer.id} 
                                layer={draftRectangleLayer.layer} 
                                onPointerDown={() => {}} 
                                selectionColor={strokeColor} 
                            />
                        ) : draftRectangleLayer.layer.type === layerType.Text ? (
                            <Text 
                                id={draftRectangleLayer.id} 
                                layer={draftRectangleLayer.layer} 
                                onPointerDown={() => {}} 
                                selectionColor={strokeColor} 
                                onValueChange={() => {}}
                            />
                        ) : draftRectangleLayer.layer.type === layerType.Note ? (
                            <Note 
                                id={draftRectangleLayer.id} 
                                layer={draftRectangleLayer.layer} 
                                onPointerDown={() => {}} 
                                selectionColor={strokeColor} 
                                onValueChange={() => {}}
                            />
                        ) : (
                            <RectangleTool 
                                id={draftRectangleLayer.id} 
                                layer={draftRectangleLayer.layer} 
                                onPointerDown={() => {}} 
                                selectionColor={strokeColor} 
                            />
                        ) 
                    )}

                    {/* 2. Rendering all established layers */}
                    {rectangleLayers.map(({ id: layerId, layer }) => {
                        // Shared props excluding the 'key'
                        const selectionColor = selection.includes(layerId) ? strokeColor : "transparent";
                        
                        // Handle specific layer types
                        if (layer.type === layerType.Rectangle) {
                            return (
                                <RectangleTool 
                                    key={layerId} 
                                    id={layerId} 
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
                                    layer={layer} 
                                    onPointerDown={onLayerPointerDown} 
                                    selectionColor={selectionColor} 
                                />
                            );
                        }

                        if (layer.type === layerType.Note || layer.type === layerType.Text) {
                            const Component = layer.type === layerType.Note ? Note : Text;
                            return (
                                <Component
                                    key={layerId}
                                    id={layerId}
                                    layer={layer as any}
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
                    {canvasState.mode === CanvasMode.Pencil && canvasState.pencilPoints && (
                        <Path 
                            points={canvasState.pencilPoints} 
                            fill={ColorToCss(lastUsedColor)} 
                            x={0} 
                            y={0} 
                        />
                    )}

                    <SelectionBox 
                        bounds={selectionBounds} 
                        onResizeHandlePointerDown={(corner, bounds) => 
                            setCanvasState({ 
                                mode: CanvasMode.Resizing, 
                                initialBounds: bounds, 
                                corner 
                            })
                        }
                        isShowingHandles={selection.length === 1} 
                    />

                    <CursorPresence cursors={otherCursors} />
                </g>
            </svg>
        </main>
    );
}