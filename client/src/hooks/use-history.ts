import { useState, useCallback } from "react";

export const useHistory = () => {
  const [history, setHistory] = useState<string[]>([]); // Array of canvas snapshots
  const [index, setIndex] = useState(-1);

  const canUndo = index > 0;
  const canRedo = index < history.length - 1;

  const undo = useCallback(() => {
    if (!canUndo) return;
    setIndex((prev) => prev - 1);
  }, [canUndo]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    setIndex((prev) => prev + 1);
  }, [canRedo]);

  const saveState = useCallback((newState: string) => {
    setHistory((prev) => {
      // If we draw something new while "undone", delete the future
      const currentHistory = prev.slice(0, index + 1);
      return [...currentHistory, newState];
    });
    setIndex((prev) => prev + 1);
  }, [index]);

  return { 
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    saveState, 
    currentState: history[index],
    history: history 
  };
};