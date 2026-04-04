"use client";

import {
  MousePointer,
  Pencil,
  Circle,
  Type,
  Undo,
  Redo,
  StickyNote,
  Square,
  Trash2,
  Eraser,
} from "lucide-react";

import { ColorPicker } from "../color-picker";
import { color, CanvasState, CanvasMode, layerType } from "@/types/canvas";
import { ToolButton } from "../tool-button/tool-button";

interface ToolbarProps {
  canvasState: CanvasState;
  setCanvasState: (state: CanvasState) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  lastUsedColor: color;
  onChangeColor: (color: color) => void;
}

export default function Toolbar({
  canvasState,
  setCanvasState,
  undo,
  redo,
  canUndo,
  canRedo,
  lastUsedColor,
  onChangeColor,
}: ToolbarProps) {
  return (
    <div className="absolute top-[50%] -translate-y-[50%] left-2 flex flex-col gap-y-4">
      <div className="bg-white rounded-md p-1.5 flex gap-y-1 flex-col items-center shadow-md">
        <ToolButton
          label="Select"
          icon={MousePointer}
          isActive={
            canvasState.mode === CanvasMode.None ||
            canvasState.mode === CanvasMode.Translating ||
            canvasState.mode === CanvasMode.SelectionNet ||
            canvasState.mode === CanvasMode.Pressing ||
            canvasState.mode === CanvasMode.Resizing
          }
          onClick={() => setCanvasState({ mode: CanvasMode.None })}
        />

        <ToolButton
          label="Text"
          icon={Type}
          isActive={
            canvasState.mode === CanvasMode.Inserting &&
            canvasState.layerType === layerType.Text
          }
          onClick={() =>
            setCanvasState({
              mode: CanvasMode.Inserting,
              layerType: layerType.Text,
            })
          }
        />

        <ToolButton
          label="Sticky note"
          icon={StickyNote}
          isActive={
            canvasState.mode === CanvasMode.Inserting &&
            canvasState.layerType === layerType.Note
          }
          onClick={() =>
            setCanvasState({
              mode: CanvasMode.Inserting,
              layerType: layerType.Note,
            })
          }
        />

        <ToolButton
          label="Rectangle"
          icon={Square}
          isActive={
            canvasState.mode === CanvasMode.Inserting &&
            canvasState.layerType === layerType.Rectangle
          }
          onClick={() =>
            setCanvasState({
              mode: CanvasMode.Inserting,
              layerType: layerType.Rectangle,
            })
          }
        />

        <ToolButton
          label="Circle"
          icon={Circle}
          isActive={
            canvasState.mode === CanvasMode.Inserting &&
            canvasState.layerType === layerType.Ellipse
          }
          onClick={() =>
            setCanvasState({
              mode: CanvasMode.Inserting,
              layerType: layerType.Ellipse,
            })
          }
        />

        <ToolButton
          label="Pencil"
          icon={Pencil}
          isActive={canvasState.mode === CanvasMode.Pencil}
          onClick={() => setCanvasState({ mode: CanvasMode.Pencil })}
        />

        <ToolButton
          label="Eraser"
          icon={Eraser}
          isActive={canvasState.mode === CanvasMode.Eraser}
          onClick={() => setCanvasState({ mode: CanvasMode.Eraser })}
        />
      </div>

      <div className="flex flex-col items-center gap-y-4 border-t border-neutral-200 pt-4">
        <ColorPicker lastUsedColor={lastUsedColor} onChange={onChangeColor} />
      </div>

      <div className="bg-white rounded-md p-1.5 flex gap-y-1 flex-col items-center shadow-md">
        <ToolButton
          label="Undo"
          icon={Undo}
          onClick={undo}
          isDisabled={!canUndo}
        />
        <ToolButton
          label="Redo"
          icon={Redo}
          onClick={redo}
          isDisabled={!canRedo}
        />
      </div>
    </div>
  );
}
