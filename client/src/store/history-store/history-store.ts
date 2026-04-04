import { create } from "zustand";

interface HistoryStore {
  past: any[]; // Array of your state snapshots
  future: any[];

  // 1. Record a move
  pushState: (currentState: any) => void;

  // 2. The Time Travel
  undo: (currentState: any) => any | null;
  redo: (currentState: any) => any | null;
}

export const useHistory = create<HistoryStore>((set, get) => ({
  past: [],
  future: [],

  pushState: (currentState) => {
    set((state) => ({
      past: [...state.past, currentState],
      future: [], // New action kills the "future"
    }));
  },

  undo: (currentState) => {
    const { past } = get();
    if (past.length === 0) return null;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);

    set((state) => ({
      past: newPast,
      future: [currentState, ...state.future],
    }));

    return previous;
  },

  redo: (currentState) => {
    const { future } = get();
    if (future.length === 0) return null;

    const next = future[0];
    const newFuture = future.slice(1);

    set((state) => ({
      past: [...state.past, currentState],
      future: newFuture,
    }));

    return next;
  },
}));
