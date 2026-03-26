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