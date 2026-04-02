import { useState, useCallback } from "react"

export const useHistory = () => {
    const [history, setHistory] = useState<string[]>([])
    const [index, setIndex] = useState(-1)


    const canUndo = index > 0
    const canRedo = index < history.length - 1

    const undo = useCallback(() => {
        if (!canUndo) return
        setIndex(prev => prev - 1)
    }, [canUndo])

    const redo = useCallback(() => {
        if (!canRedo) return
        setIndex(prev => prev + 1)
    }, [canRedo])

} 