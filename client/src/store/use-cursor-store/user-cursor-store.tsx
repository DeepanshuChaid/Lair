// store/use-cursor-store.ts
import { create } from "zustand";

export interface CursorData {
  x: number;
  y: number;
  name: string;
}

interface CursorStore {
  // Store all remote cursors by connection ID
  cursors: Record<string, CursorData>;
  
  // Method to update a single cursor immediately
  updateCursor: (connectionId: string, data: CursorData) => void;
  
  // Method to remove a cursor when someone disconnects
  removeCursor: (connectionId: string) => void;
}

export const useCursorStore = create<CursorStore>((set) => ({
  cursors: {},
  
  updateCursor: (connectionId, data) => 
    set((state) => ({
      cursors: {
        ...state.cursors,
        [connectionId]: data,
      },
    })),
    
  removeCursor: (connectionId) =>
    set((state) => {
      const newCursors = { ...state.cursors };
      delete newCursors[connectionId];
      return { cursors: newCursors };
    }),
}));
