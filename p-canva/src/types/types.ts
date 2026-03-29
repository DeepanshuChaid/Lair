// this refers to the state of the canvas which prevents unexpected states
export type CanvasState = {
    mode: CavnasMode.None;
} | {
    mode: CavnasMode.Pressing;
    origin: Point;
} | {
    mode: CavnasMode.Inserting
    layerType: LayerType;
} | {
    mode: CavnasMode.SelectionNet;
    origin: Point;
    current?: Point;
} | {
    mode: CavnasMode.Translating
    current: Point;
} | {
    mode: CavnasMode.Resizing;
    initialBounds: XYMH
    corner: Side
} | {
    mode: CavnasMode.Translating;
    current: Point;
} | {
    mode: CavnasMode.Pencil;
    pencilPoints?: number[][];
}

// enums are used instead of raw string as we would not get error like we would with strings
export enum CavnasMode {
    None,
    Pressing,
    Inserting,
    SelectionNet,
    Translating,
    Resizing,
    Pencil,
}

export type Color = {
    r: number;
    g: number;
    b: number;
}

export type Camera = {
    x: number;
    y: number;
}

export type XYMH = {
    x: number;
    y: number;
    width: number;
    height: number;
}

export enum Side {
    top = 1,
    bottom = 2,
    left = 4,
    right = 8,
}

export enum LayerType {
    Rectangle,
    Ellipse,
    Text,
    Note,
    Path
}

export type Point = {
    x: number;
    y: number;
}

export type RectangleLayer = {
    type: LayerType.Rectangle;
    x: number;
    y: number;
    width: number;
    height: number;
    fill: Color;
    value?: string;
}

export type EllipseLayer = {
    type: LayerType.Ellipse;
    x: number;
    y: number;
    width: number;
    height: number;
    fill: Color;
    value?: string;
}

export type TextLayer = {
    type: LayerType.Text;
    x: number;
    y: number;
    width: number;
    height: number;
    fill: Color;
    value?: string;
}

export type NoteLayer = {
    type: LayerType.Note;
    x: number;
    y: number;
    width: number;
    height: number;
    fill: Color;
    value?: string;
}

export type PathLayer = {
    type: LayerType.Path
    x: number;
    y: number;
    width: number;
    height: number;
    fill: Color;
    points: number[][];
    value?: string;
}

export type Layer = RectangleLayer | EllipseLayer | TextLayer | NoteLayer | PathLayer;