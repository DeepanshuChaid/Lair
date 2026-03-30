import { CanvasMode, CanvasState, LayerType } from "@/types/types";


export default function ToolBar ({canvasState, setCanvasState}: {canvasState: CanvasState, setCanvasState: (state: CanvasState) => void}) {
    return (
        <div className={`absolute bg-white top-[50%] -translate-y-[50%] left-2 flex flex-col gap-y-4`}>
            <button style={{}} className={`p-4 bg-amber-300 ${canvasState.mode === CanvasMode.None ? 'ring-2 ring-blue-500' : ''}`} onClick={() => {
                setCanvasState({ mode: CanvasMode.None })
            }}>
                Cursor
            </button>
            <button className={`p-4 bg-amber-300 ${canvasState.mode === CanvasMode.Inserting && canvasState.layerType === LayerType.Rectangle ? 'ring-2 ring-blue-500' : ''}`} onClick={() => {
                setCanvasState({mode: CanvasMode.Inserting, layerType: LayerType.Rectangle});
            }}>
                Rect
            </button>

            <button className={`p-4 bg-amber-300 ${canvasState.mode === CanvasMode.Inserting && canvasState.layerType === LayerType.Ellipse ? 'ring-2 ring-blue-500' : ''}`} onClick={() => {
                setCanvasState({mode: CanvasMode.Inserting, layerType: LayerType.Ellipse})
            }}>
                Ellipse
            </button>
        </div>
    )
}