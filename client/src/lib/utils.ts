import { color, Point, Side } from "@/types/canvas";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


const COLORS = [
  "#DC2626", // Red
  "#D97706", // Amber
  "#059669", // Emerald
  "#7C3AED", // Violet
  "#DB2777"  // Pink
]

export function connectionColor(id: string): string {
  // Simple hash algorithm to turn string into a number
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use absolute value and modulo to pick a color
  const index = Math.abs(hash) % COLORS.length;
  return COLORS[index];
}

export function ColorToCss(color: color) {
  const r = color.r.toString(16).padStart(2, "0");
  const g = color.g.toString(16).padStart(2, "0");
  const b = color.b.toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

export function cssToColor(css_color: string) {
    // Safety check: if it's null, undefined, or not a string
    if (!css_color || typeof css_color !== "string" || !css_color.startsWith("#")) {
        return { r: 255, g: 255, b: 255 };
    }

    // Handle #RGB and #RRGGBB
    let hex = css_color.replace("#", "");
    if (hex.length === 3) {
        hex = hex.split("").map((char) => char + char).join("");
    }

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return { 
        r: isNaN(r) ? 255 : r, 
        g: isNaN(g) ? 255 : g, 
        b: isNaN(b) ? 255 : b 
    };
}

export function getSvgPathFromStroke(stroke: number[][]) {
  if (!stroke.length) return "";

  const d = stroke.reduce(
    (acc, [x, y], i) => {
      if (i === 0) return `M ${x} ${y}`;
      return `${acc} L ${x} ${y}`;
    },
    ""
  );

  return `${d} Z`; // The "Z" closes the path for the freehand look
}

export function getContrastingTextColor(color: { r: number; g: number; b: number }) {
    const yiq = (color.r * 299 + color.g * 587 + color.b * 114) / 1000;
    return yiq >= 128 ? "black" : "white";
}

export function throttle(func: Function, limit: number) {
  let inThrottle: boolean;
  return function(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}



export const findLayerByPoint = (x: number, y: number, layers: any[]) => {
  for (let i = layers.length - 1; i >= 0; i--) {
    const layerObj = layers[i];
    const layer = layerObj.layer; // Fixed: Extract the actual layer state!
    
    if (
      x >= layer.x &&
      x <= layer.x + layer.width &&
      y >= layer.y &&
      y <= layer.y + layer.height
    ) {
      return layerObj.id; // Fixed: return the ID!
    }
  }
  return null;
};
