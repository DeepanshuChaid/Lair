"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { CanvasMode, CanvasState, color, layerType, Point, RectangleLayer, Side, XYMH } from "@/types/canvas";
import { useHistory } from "@/hooks/use-history";
import { connectSocket } from "@/lib/api/websocket-api";

import Info from "../info/info";
import Members from "../members/members";
import Toolbar from "../toolbar/toolbar";
import { CursorPresence } from "../cursor-presence";
import { useAuth } from "@/providers/auth-provider";
import {LayerPreview} from "../layer-preview";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Rectangle as RectangleTool } from "../boardTools/rectangle";
import { SelectionBox } from "../selection-box";
import { Ellipse } from "../boardTools/ellipse";
import { cssToColor } from "@/lib/utils";

const MAX_LAYERS = 500;

export default function Canvas({id, title}: {id: string, title: string}) {
    const [canvasState, setCanvasState] = useState<CanvasState>({ mode: CanvasMode.None });
    const { undo, redo, canUndo, canRedo, saveState, currentState, history } = useHistory();

    const router = useRouter()

    const [camera, setCamera] = useState({ x: 0, y: 0, scale: 1 });

    const [lastUsedColor, setLastUsedColor] = useState<color>({
        r: 0,
        b: 255,
        g: 0,
    });

    const {user} = useAuth();
    
    // State to track other users' cursors
    const [otherCursors, setOtherCursors] = useState<Record<string, {x: number, y: number, name: string}>>({});
    const wsRef = useRef<WebSocket | null>(null);
    const lastSentRef = useRef<number>(0); 

    // Frontend-only rectangle layers (no websocket persistence yet).
    const [rectangleLayers, setRectangleLayers] = useState<
        Array<{ id: string; layer: RectangleLayer }>
    >([]);
    const [draftRectangleLayer, setDraftRectangleLayer] = useState<
        { id: string; layer: RectangleLayer } | null
    >(null);

    const svgRef = useRef<SVGSVGElement | null>(null);
    const insertingStartRef = useRef<Point | null>(null);
    const rectIdCounterRef = useRef(0);
    const didInitHistoryRef = useRef(false);

    useEffect(() => {
        let isCancelled = false;
        const setup = async () => {
            try {
                const { socket, error } = await connectSocket(id);
                if (error !== null) {
                    toast({
                        title: "Error",
                        description: error,
                        variant: "destructive",
                    })
                    router.push("/")
                    return;
                }
                if (isCancelled) { socket.close(); return; }
                wsRef.current = socket;

                socket.onmessage = (event: any) => {
                    const data = JSON.parse(event.data);
                    
                    // If we receive a cursor move from someone else
                    if (data.type === "CURSOR_MOVE") {
                        setOtherCursors((prev) => ({
                            ...prev,
                            [data.userId]: data.content // content is {x, y}
                        }));
                    }
                };
            } catch (err) { console.error(err); }
        };
        setup();
        return () => { isCancelled = true; wsRef.current?.close(); };
    }, [id]);

    // Seed history with an initial empty snapshot so undo returns to "no rectangles".
    useEffect(() => {
        if (didInitHistoryRef.current) return;
        didInitHistoryRef.current = true;
        saveState(JSON.stringify([]));
    }, [saveState]);

    // Apply history snapshots to the current frontend-only rectangle layers.
    useEffect(() => {
        if (currentState === undefined) return;

        try {
            const parsed = JSON.parse(currentState) as Array<{ id: string; layer: RectangleLayer }>;
            if (Array.isArray(parsed)) {
                setRectangleLayers(parsed);
            }
        } catch {
            // If history contains unexpected data, don't crash the UI.
        } finally {
            // Never keep a stale draft while undo/redo changes the canvas.
            insertingStartRef.current = null;
            setDraftRectangleLayer(null);
        }
    }, [currentState]);

    // Keyboard shortcuts for frontend undo/redo.
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            // Avoid interfering with typing.
            const target = e.target as HTMLElement | null;
            const tag = target?.tagName?.toLowerCase();
            const isTypingContext =
                tag === "input" || tag === "textarea" || !!target?.isContentEditable;
            if (isTypingContext) return;

            if (!e.ctrlKey) return;
            if (e.repeat) return;

            if (e.key === "z" || e.key === "Z") {
                e.preventDefault();
                undo();
                return;
            }

            if (e.key === "y" || e.key === "Y") {
                e.preventDefault();
                redo();
                return;
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [undo, redo]);

    // If the user switches tools mid-drag, cancel the current rectangle preview.
    useEffect(() => {
        if (canvasState.mode !== CanvasMode.Inserting || canvasState.layerType !== "Rectangle") {
            insertingStartRef.current = null;
            setDraftRectangleLayer(null);
        }
    }, [canvasState]);

    const onWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();
    
        if (e.ctrlKey || e.metaKey) {
            // --- ZOOM LOGIC (Keep as is) ---
            const zoomSpeed = 0.001;
            const delta = -e.deltaY;
            const scaleChange = delta * zoomSpeed;
            
            setCamera((prev) => {
                const newScale = Math.min(Math.max(prev.scale + scaleChange, 0.1), 10);
                const mouseX = e.clientX;
                const mouseY = e.clientY;
                
                const dx = (mouseX - prev.x) * (newScale / prev.scale - 1);
                const dy = (mouseY - prev.y) * (newScale / prev.scale - 1);
    
                return {
                    x: prev.x - dx,
                    y: prev.y - dy,
                    scale: newScale,
                };
            });
        } else {
            // --- PAN LOGIC WITH SHIFT-SCROLL ---
            setCamera((prev) => {
                if (e.shiftKey) {
                    // If Shift is held, vertical scroll (deltaY) moves the camera horizontally
                    return {
                        ...prev,
                        x: prev.x - e.deltaY, 
                        y: prev.y - e.deltaX, // deltaX might still exist from a trackpad
                    };
                }
                
                // Standard behavior
                return {
                    ...prev,
                    x: prev.x - e.deltaX,
                    y: prev.y - e.deltaY,
                };
            });
        }
    }, []);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;
    
        // Attach native event listener with passive: false
        const handleWheel = (e: WheelEvent) => onWheel(e);
        
        svg.addEventListener("wheel", handleWheel, { passive: false });
        return () => svg.removeEventListener("wheel", handleWheel);
    }, [onWheel]);

    const strokeColor = `rgb(${lastUsedColor.r}, ${lastUsedColor.g}, ${lastUsedColor.b})`;

    const clientToWorld = useCallback(
        (clientX: number, clientY: number) => {
            const bounds = svgRef.current?.getBoundingClientRect();
            const left = bounds?.left ?? 0;
            const top = bounds?.top ?? 0;
            
            return {
                // Subtract camera offset, then scale it
                x: (clientX - left - camera.x) / camera.scale,
                y: (clientY - top - camera.y) / camera.scale,
            };
        },
        [camera.x, camera.y, camera.scale] // Add scale to dependencies
    );

    const onSvgPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
        const coords = clientToWorld(e.clientX, e.clientY);
    
        // 1. Handle Insertion (Drawing new rectangles)
        if (canvasState.mode === CanvasMode.Inserting) {
            insertingStartRef.current = coords;
            return;
        }
    
        // 2. Handle Selection (Clicking the background)
        if (canvasState.mode === CanvasMode.None) {
            setSelection([]); 
            setCanvasState({ mode: CanvasMode.SelectionNet, origin: coords });
            return;
        }
    }, [canvasState, clientToWorld]);

    const onSvgPointerMove = useCallback(
        (e: React.PointerEvent<SVGSVGElement>) => {
            if (!insertingStartRef.current) return;
            if (canvasState.mode !== CanvasMode.Inserting) return;
    
            const start = insertingStartRef.current;
            const end = clientToWorld(e.clientX, e.clientY);
    
            const x = Math.min(start.x, end.x);
            const y = Math.min(start.y, end.y);
            const width = Math.abs(end.x - start.x);
            const height = Math.abs(end.y - start.y);
    
            // Use the current layerType from state (Rectangle, Ellipse, etc.)
            setDraftRectangleLayer({
                id: "draft",
                layer: {
                    type: canvasState.layerType, // Use active tool type
                    x,
                    y,
                    width,
                    height,
                    fill: lastUsedColor,
                } as any,
            });
    
            e.preventDefault();
        },
        [canvasState, clientToWorld, lastUsedColor]
    );

    const onSvgPointerUp = useCallback(
        (e: React.PointerEvent<SVGSVGElement>) => {
            if (!insertingStartRef.current || canvasState.mode !== CanvasMode.Inserting) return;
    
            const start = insertingStartRef.current;
            const end = clientToWorld(e.clientX, e.clientY);
    
            const x = Math.min(start.x, end.x);
            const y = Math.min(start.y, end.y);
            const width = Math.abs(end.x - start.x);
            const height = Math.abs(end.y - start.y);
    
            if (width >= 1 && height >= 1) {
                const newId = `layer-${rectIdCounterRef.current++}`;
                
                // Clean and type-safe!
                const type = canvasState.layerType;
    
                const nextLayers = [
                    ...rectangleLayers,
                    {
                        id: newId,
                        layer: {
                            type, // TypeScript now knows this is a valid layerType
                            x,
                            y,
                            width,
                            height,
                            fill: lastUsedColor,
                        } as any, // Use your Layer union type here
                    },
                ];
    
                saveState(JSON.stringify(nextLayers));
                setRectangleLayers(nextLayers); // Ensure local state updates too
            }
    
            insertingStartRef.current = null;
            setDraftRectangleLayer(null);
            setCanvasState({ mode: CanvasMode.None });
        },
        [canvasState, clientToWorld, lastUsedColor, rectangleLayers, saveState]
    );


    const [selection, setSelection] = useState<string[]>([]); // Array of selected layer IDs

    // Helper to get bounds of selected layers for the SelectionBox
    const selectionBounds = useMemo(() => {
        const selectedLayers = rectangleLayers.filter(l => selection.includes(l.id));
        if (selectedLayers.length === 0) return null;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        selectedLayers.forEach(({ layer }) => {
            minX = Math.min(minX, layer.x);
            minY = Math.min(minY, layer.y);
            maxX = Math.max(maxX, layer.x + layer.width);
            maxY = Math.max(maxY, layer.y + layer.height);
        });

        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }, [selection, rectangleLayers]);


    const onLayerPointerDown = useCallback((e: React.PointerEvent, layerId: string) => {
        if (canvasState.mode === CanvasMode.Inserting || canvasState.mode === CanvasMode.Pencil) return;
    
        e.stopPropagation(); // Prevent the SVG background from clearing selection
        
        const coords = clientToWorld(e.clientX, e.clientY);
        
        // If shift isn't held, clear other selections
        if (!e.shiftKey) {
            setSelection([layerId]);
        } else {
            setSelection(prev => prev.includes(layerId) ? prev.filter(id => id !== layerId) : [...prev, layerId]);
        }
    
        setCanvasState({ mode: CanvasMode.Translating, current: coords });
    }, [canvasState.mode, clientToWorld]);

    const onResizeHandlePointerDown = useCallback((corner: Side, initialBounds: XYMH) => {
        setCanvasState({
            mode: CanvasMode.Resizing,
            initialBounds,
            corner,
        });
    }, []);

    const onPointerUp = useCallback(() => {
        if (canvasState.mode === CanvasMode.Resizing || canvasState.mode === CanvasMode.Translating) {
            // This pushes the final position to your Undo/Redo history
            saveState(JSON.stringify(rectangleLayers));
        }
        
        // Reset the mode so the cursor doesn't "stick" to the object
        setCanvasState({ mode: CanvasMode.None });
    }, [canvasState.mode, rectangleLayers, saveState]);

    // THROTTLED MOUSE MOVE
    const onPointerMove = useCallback((e: React.PointerEvent) => {
        const coords = clientToWorld(e.clientX, e.clientY);
    
        // --- RESIZING LOGIC ---
        if (canvasState.mode === CanvasMode.Resizing && selection.length === 1) {
            const { initialBounds, corner } = canvasState;
            setRectangleLayers((prev) => prev.map((item) => {
                if (item.id === selection[0]) {
                    let { x, y, width, height } = initialBounds;
                    if ((corner & Side.top) === Side.top) {
                        y = Math.min(coords.y, initialBounds.y + initialBounds.height);
                        height = Math.abs(initialBounds.y + initialBounds.height - coords.y);
                    }
                    if ((corner & Side.bottom) === Side.bottom) {
                        y = Math.min(coords.y, initialBounds.y);
                        height = Math.abs(coords.y - initialBounds.y);
                    }
                    if ((corner & Side.left) === Side.left) {
                        x = Math.min(coords.x, initialBounds.x + initialBounds.width);
                        width = Math.abs(initialBounds.x + initialBounds.width - coords.x);
                    }
                    if ((corner & Side.right) === Side.right) {
                        x = Math.min(coords.x, initialBounds.x);
                        width = Math.abs(coords.x - initialBounds.x);
                    }
                    return { ...item, layer: { ...item.layer, x, y, width, height } };
                }
                return item;
            }));
        }
    
        // --- TRANSLATING (MOVING) LOGIC ---
        if (canvasState.mode === CanvasMode.Translating && selection.length > 0) {
            const offset = {
                x: coords.x - canvasState.current.x,
                y: coords.y - canvasState.current.y,
            };
    
            setRectangleLayers((prev) => prev.map((item) => {
                if (selection.includes(item.id)) {
                    return {
                        ...item,
                        layer: {
                            ...item.layer,
                            x: item.layer.x + offset.x,
                            y: item.layer.y + offset.y,
                        }
                    };
                }
                return item;
            }));
            // Crucial: Update the reference point for the next move tick
            setCanvasState({ mode: CanvasMode.Translating, current: coords });
        }
    
        // --- CURSOR SYNC ---
        const now = Date.now();
        if (now - lastSentRef.current < 30) return;
        lastSentRef.current = now;
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: "CURSOR_MOVE",
                content: { x: Math.round(e.clientX), y: Math.round(e.clientY), name: user?.name || "Anonymous" }
            }));
        }
    }, [canvasState, selection, clientToWorld, user?.name]);


    // Inside your Canvas component
    const setFill = useCallback((fill: color) => {
        setLastUsedColor(fill);

        // If there are items selected, update their color immediately
        if (selection.length > 0) {
            setRectangleLayers((prev) => prev.map((item) => {
                if (selection.includes(item.id)) {
                    return {
                        ...item,
                        layer: { ...item.layer, fill }
                    };
                }
                return item;
            }));

            // Push to history after the change
            saveState(JSON.stringify(rectangleLayers));
        }
    }, [selection, rectangleLayers, saveState]);


    const onChangeColor = useCallback((fill: string) => {
        const newColor = cssToColor(fill); 
        setLastUsedColor(newColor);
    
        if (selection.length > 0) {
            setRectangleLayers((prev) => prev.map((item) => { // Changed from setLayers to setRectangleLayers
                if (selection.includes(item.id)) {
                    return { 
                        ...item, 
                        layer: { ...item.layer, fill: newColor } // Note: you need to access item.layer.fill
                    };
                }
                return item;
            }));
    
            // Push to history after the change
            saveState(JSON.stringify(rectangleLayers));
        }
    }, [selection, rectangleLayers, saveState]);



    useEffect(() => {
        console.log("reactangleLayer :", rectangleLayers)
        // console.log('history :',  history)
        console.log("currentState :", currentState)
    })


    return (
        <main 
            className="h-full w-full relative bg-neutral-100 touch-none overflow-hidden"
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp} // <--- ADD THIS
        >
            <Info id={id} title={title}/>
            <Members id={id} />
            <Toolbar  
                canvasState={canvasState}
                setCanvasState={setCanvasState}
                undo={undo}
                redo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
                lastUsedColor={lastUsedColor} // Pass this
                onChangeColor={onChangeColor} // Pass this
            />

            <svg
                ref={svgRef}
                className="h-screen w-screen bg-neutral-100 touch-none"
                onPointerDown={onSvgPointerDown}
                onPointerMove={onSvgPointerMove}
                onPointerUp={onSvgPointerUp} // This handles new layer insertion
            >
                    <g 
                        style={{
                            // translate first, then scale
                            transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
                            transformOrigin: "0 0", // Crucial for manual math
                        }}
                    >
                    {draftRectangleLayer && (
                        draftRectangleLayer.layer.type === layerType.Ellipse ? (
                            <Ellipse 
                                id={draftRectangleLayer.id}
                                layer={draftRectangleLayer.layer as any}
                                onPointerDown={() => {}}
                                selectionColor={strokeColor}
                            />
                        ) : (
                            <RectangleTool
                                id={draftRectangleLayer.id}
                                layer={draftRectangleLayer.layer as any}
                                onPointerDown={() => {}}
                                selectionColor={strokeColor}
                            />
                        )
                    )}

                    {rectangleLayers.map(({ id: layerId, layer }) => {
                        if (layer.type === layerType.Rectangle) {
                            return (
                                <RectangleTool
                                    key={layerId}
                                    id={layerId}
                                    layer={layer}
                                    onPointerDown={onLayerPointerDown} 
                                    selectionColor={selection.includes(layerId) ? strokeColor : "transparent"}
                                />
                            );
                        } else if (layer.type === layerType.Ellipse) {
                            return (
                                <Ellipse
                                    key={layerId}
                                    id={layerId}
                                    layer={layer}
                                    onPointerDown={onLayerPointerDown}
                                    selectionColor={selection.includes(layerId) ? strokeColor : "transparent"}
                                />
                            );
                        }
                        return null;
                    })}

                    <SelectionBox
                        bounds={selectionBounds} 
                        onResizeHandlePointerDown={onResizeHandlePointerDown}
                        isShowingHandles={selection.length === 1} // Only show handles when one item is selected
                    />

                    <CursorPresence cursors={otherCursors} />
                </g>
            </svg>
        </main>
    );
} 

