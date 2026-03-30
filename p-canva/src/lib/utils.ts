import { Color } from "@/types/types";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function ColorToCss(color: Color) {
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

export function getContrastingTextColor(color: { r: number; g: number; b: number }) {
    const yiq = (color.r * 299 + color.g * 587 + color.b * 114) / 1000;
    return yiq >= 128 ? "black" : "white";
}