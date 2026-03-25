export type CanvasState = 
    {
        mode: CanvasMode.None,
    }
    |
    {
        mode: CanvasMode.Pressing;
        origin: Point;
    }
    |
    {
        mode: CanvasMode.SelectionNet;
        origin: Point;
        current?: Point
    }
    |
    {
        mode: CanvasMode.Translating
        current: Point;
    }
    |
    {
        mode: CanvasMode.Inserting
        layerType: "Text" | "Note" | "Rectangle" | "Ellipse";
    }
    |
    {
        mode: CanvasMode.Resizing;
        initialBounds: XYMH;
        corner: Side;
    }
    |
    {mode: CanvasMode.Pencil}

;

export enum CanvasMode {
    None,
    Pressing,
    SelectionNet,
    Translating,
    Inserting,
    Resizing,
    Pencil
}

export type color = {
    r: number;
    g: number;
    b: number;
}

export type Camera = {
    x: number;
    y: number;
}

export enum layerType {
    Rectangle,
    Ellipse,
    Path,
    Text,
    Note,
}

export type RectangleLayer = {
    type: layerType.Rectangle,
    x: number;
    y: number;
    height: number;
    width: number;
    fill: color;
    value?: string;
}

export type EllipseLayer = {
    type: layerType.Ellipse,
    x: number;
    y: number;
    height: number;
    width: number;
    fill: color;
    value?: string;
}

export type PathLayer = {
    type: layerType.Path,
    x: number;
    y: number;
    height: number;
    width: number;
    fill: color;
    Points: number[][];
    value?: string;
}

export type TextLayer = {
    type: layerType.Text,
    x: number;
    y: number;
    height: number;
    width: number;
    fill: color;
    value?: string;
}

export type NoteLayer = {
    type: layerType.Note,
    x: number;
    y: number;
    height: number;
    width: number;
    fill: color;
    value?: string;
}

export type Point = {
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



export type Layer = RectangleLayer | EllipseLayer | PathLayer | TextLayer | NoteLayer;