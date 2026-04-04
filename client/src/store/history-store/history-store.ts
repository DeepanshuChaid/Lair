import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { Layer, CanvasState, CanvasMode } from "@/types/canvas";

interface HistorySnapshot {
  type: "INSERT" | "UPDATE" | "DELETE";
  layerId: string;
  oldData?: Layer | null;
  newdata?: Layer | null;
}

interface HistoryStore {
  layers: string[];
  layerMap: Record<string, Layer>;
  canvasState: CanvasState;
  past: HistorySnapshot[];
  future: HistorySnapshot[];

  setCanvasState: (newState: CanvasState) => void;
  insertLayer: (id: string, layer: Layer, saveToHistory?: boolean) => void;
  updateLayer: (
    id: string,
    partialLayer: Partial<Layer>,
    saveToHistory?: boolean,
  ) => void;
  deleteLayer: (id: string, saveToHistory?: boolean) => void;
  undo: () => void;
  redo: () => void;
}

export const historyStore = create<HistoryStore>()(
  subscribeWithSelector((set) => ({
    layers: [],
    layerMap: {},
    canvasState: { mode: CanvasMode.None },
    past: [],
    future: [],

    setCanvasState: (newState) => set({ canvasState: newState }),

    insertLayer: (id, layer, saveToHistory = true) => {
      set((state) => {
        const snapshot: HistorySnapshot = {
          type: "INSERT",
          layerId: id,
          newdata: layer,
        };
        return {
          layers: [...state.layers, id],
          layerMap: { ...state.layerMap, [id]: layer },
          past: saveToHistory ? [...state.past, snapshot] : state.past,
          future: saveToHistory ? [] : state.future,
        };
      });
    },

    updateLayer: (id, partialLayer, saveToHistory = false) => {
      set((state) => {
        const existingLayer = state.layerMap[id];
        if (!existingLayer) return state;

        const updatedLayer = { ...existingLayer, ...partialLayer } as Layer;
        const snapshot: HistorySnapshot = {
          type: "UPDATE",
          layerId: id,
          oldData: existingLayer,
          newdata: updatedLayer,
        };

        return {
          layerMap: { ...state.layerMap, [id]: updatedLayer },
          past: saveToHistory ? [...state.past, snapshot] : state.past,
          future: saveToHistory ? [] : state.future,
        };
      });
    },

    deleteLayer: (id, saveToHistory = true) => {
      set((state) => {
        const existingLayer = state.layerMap[id];
        if (!existingLayer) return state;

        const snapshot: HistorySnapshot = {
          type: "DELETE",
          layerId: id,
          oldData: existingLayer,
        };
        const newLayerMap = { ...state.layerMap };
        delete newLayerMap[id];

        return {
          layers: state.layers.filter((lId) => lId !== id),
          layerMap: newLayerMap,
          past: saveToHistory ? [...state.past, snapshot] : state.past,
          future: saveToHistory ? [] : state.future,
        };
      });
    },

    undo: () => {
      set((state) => {
        if (state.past.length === 0) return state;

        const lastAction = state.past[state.past.length - 1];
        const newPast = state.past.slice(0, -1);
        const newLayerMap = { ...state.layerMap };
        let newLayers = [...state.layers];

        if (lastAction.type === "INSERT") {
          delete newLayerMap[lastAction.layerId];
          newLayers = newLayers.filter((id) => id !== lastAction.layerId);
        } else if (lastAction.type === "UPDATE" && lastAction.oldData) {
          newLayerMap[lastAction.layerId] = lastAction.oldData;
        } else if (lastAction.type === "DELETE" && lastAction.oldData) {
          newLayerMap[lastAction.layerId] = lastAction.oldData;
          newLayers.push(lastAction.layerId);
        }

        return {
          layerMap: newLayerMap,
          layers: newLayers,
          past: newPast,
          future: [lastAction, ...state.future],
        };
      });
    },

    redo: () => {
      set((state) => {
        if (state.future.length === 0) return state;

        const nextAction = state.future[0];
        const newFuture = state.future.slice(1);
        const newLayerMap = { ...state.layerMap };
        let newLayers = [...state.layers];

        if (nextAction.type === "INSERT" && nextAction.newdata) {
          newLayerMap[nextAction.layerId] = nextAction.newdata;
          newLayers.push(nextAction.layerId);
        } else if (nextAction.type === "UPDATE" && nextAction.newdata) {
          newLayerMap[nextAction.layerId] = nextAction.newdata;
        } else if (nextAction.type === "DELETE") {
          delete newLayerMap[nextAction.layerId];
          newLayers = newLayers.filter((id) => id !== nextAction.layerId);
        }

        return {
          layerMap: newLayerMap,
          layers: newLayers,
          past: [...state.past, nextAction],
          future: newFuture,
        };
      });
    },
  })),
);
