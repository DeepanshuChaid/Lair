import { color } from "@/types/canvas";
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
  return `${color.r.toString(16).padStart(2, "0")}${color.g.toString(16).padStart(2, "0")}${color.g.toString(16).padStart(2, "0")}`
}

export function cssToColor(css_color: string) {
  if (!css_color.startsWith("#") || css_color.length !== 7) {
      return { r: 255, g: 255, b: 255 };
  }

  const hex_color = css_color.slice(1);

  const r = parseInt(hex_color.substring(0, 2), 16);
  const g = parseInt(hex_color.substring(2, 4), 16);
  const b = parseInt(hex_color.substring(4), 16);

  return { r, g, b };
}