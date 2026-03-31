// this refers to the state of the canvas which prevents unexpected states
export type CanvasState = {
    mode: CanvasMode.None;
} | {
    mode: CanvasMode.Pressing;
    origin: Point;
} | {
    mode: CanvasMode.Inserting
    layerType: LayerType;
} | {
    mode: CanvasMode.SelectionNet;
    origin: Point;
    current?: Point;
} | {
    mode: CanvasMode.Translating
    current: Point;
} | {
    mode: CanvasMode.Resizing;
    // When you drag a handle, your mouse moves continuously. 
    // If you recalculate the new size based on the currently changing size, your shape would rapidly explode or warp 
    // exponentially on the screen. By comparing your current mouse position to the frozen-in-time initialBounds, your
    // math stays perfectly stable no matter how crazy you move the mouse.
    initialBounds: XYMH

    // THIS STORES WHICH WIDTH USER CLICK ON? TOP, BOTTOM, LEFT, RIGHT
    // WHY WE NEED IT IF USER DRAGS THE MOUSE TO RIGHT YOU NEED TO KNWO WHAT THEY CLICKED TO KNOW WHAT TO DO?
    // BASICALLY IF ITS IN X WE INCREASE / DEACRESE THE WIDTH IF ITS IN Y COORDS WE KNOW WE NEED TO MUTATE THE HEIGHT
    corner: Side
} | {
    mode: CanvasMode.Pencil;
    pencilPoints?: number[][];
}

// enums are used instead of raw string as we would get error like we would with strings
export enum CanvasMode {
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