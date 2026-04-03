import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { Layer, CanvasState, CanvasMode } from "@/types/canvas";

interface HistorySnapshot {
  layers: string[];
  layerMap: Record<string, Layer>;
}

interface HistoryStore {
  // Current State
  layers: string[]; // Ordered array of layer IDs for rendering/z-index
  layerMap: Record<string, Layer>; // Fast lookup table

  canvasState: CanvasState;

  // History State
  past: HistorySnapshot[];
  future: HistorySnapshot[];

  // Actions
  setCanvasState: (newState: CanvasState) => void;

  // Specific Updates
  insertLayer: (id: string, layer: Layer, saveToHistory?: boolean) => void;
  // PARTIAL MAKES ALL OF THE TPYES IN THE INTERFACE OR TYPE OPTIONAL
  updateLayer: (
    id: string,
    partialLayer: Partial<Layer>,
    saveToHistory?: boolean,
  ) => void;
  deleteLayer: (id: string, saveToHistory?: boolean) => void;

  // History actions
  undo: () => void;
  redo: () => void;

  // Call this when you drag completes or an action definitively ends
  commitToHistory: () => void;
}

export const historyStore = create<HistoryStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    layers: [],
    layerMap: {},
    canvasState: { mode: CanvasMode.None },

    // History
    past: [],
    future: [],

    setCanvasState: (newState) => {
      set({ canvasState: newState });
    },

    commitToHistory: () => {
      set((state) => {
        const snapshot: HistorySnapshot = {
          layers: [...state.layers],
          layerMap: { ...state.layerMap },
        };
        return {
          past: [...state.past, snapshot],
          future: [], // Clear future on new action
        };
      });
    },

    insertLayer: (id, layer, saveToHistory = true) => {
      set((state) => {
        let newPast = state.past;
        if (saveToHistory) {
          newPast = [
            ...state.past,
            { layers: [...state.layers], layerMap: { ...state.layerMap } },
          ];
        }

        return {
          layers: [...state.layers, id],
          layerMap: {
            ...state.layerMap,
            [id]: layer,
          },
          past: newPast,
          future: saveToHistory ? [] : state.future,
        };
      });
    },

    updateLayer: (id, partialLayer, saveToHistory = false) => {
      set((state) => {
        const existingLayer = state.layerMap[id];
        if (!existingLayer) return state;

        // Apply partial update while preserving original properties
        const updatedLayer = { ...existingLayer, ...partialLayer } as Layer;

        let newPast = state.past;
        if (saveToHistory) {
          newPast = [
            ...state.past,
            { layers: [...state.layers], layerMap: { ...state.layerMap } },
          ];
        }

        return {
          layerMap: {
            ...state.layerMap,
            [id]: updatedLayer,
          },
          past: newPast,
          future: saveToHistory ? [] : state.future,
        };
      });
    },

    deleteLayer: (id, saveToHistory = true) => {
      set((state) => {
        if (!state.layerMap[id]) return state;

        let newPast = state.past;
        if (saveToHistory) {
          newPast = [
            ...state.past,
            { layers: [...state.layers], layerMap: { ...state.layerMap } },
          ];
        }

        const newLayers = state.layers.filter((lId) => lId !== id);
        const newLayerMap = { ...state.layerMap };
        delete newLayerMap[id];

        return {
          layers: newLayers,
          layerMap: newLayerMap,
          past: newPast,
          future: saveToHistory ? [] : state.future,
        };
      });
    },

    undo: () => {
      set((state) => {
        if (state.past.length === 0) return state;

        const previousSnapshot = state.past[state.past.length - 1];
        const newPast = state.past.slice(0, state.past.length - 1);

        const currentSnapshot: HistorySnapshot = {
          layers: [...state.layers],
          layerMap: { ...state.layerMap },
        };

        return {
          layers: previousSnapshot.layers,
          layerMap: previousSnapshot.layerMap,
          past: newPast,
          future: [currentSnapshot, ...state.future],
        };
      });
    },

    redo: () => {
      set((state) => {
        if (state.future.length === 0) return state;

        const nextSnapshot = state.future[0];
        const newFuture = state.future.slice(1);

        const currentSnapshot: HistorySnapshot = {
          layers: [...state.layers],
          layerMap: { ...state.layerMap },
        };

        return {
          layers: nextSnapshot.layers,
          layerMap: nextSnapshot.layerMap,
          past: [...state.past, currentSnapshot],
          future: newFuture,
        };
      });
    },
  })),
);
