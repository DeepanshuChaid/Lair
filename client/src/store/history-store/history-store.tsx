import {create} from "zustand"

interface Layer {
    id: string;
    type: "rectangle" | "pencil" | "text"
}