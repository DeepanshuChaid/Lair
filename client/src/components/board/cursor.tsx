"use client";

import { memo, useEffect, useRef } from "react";
import { MousePointer2 } from "lucide-react";
import gsap from "gsap";

interface CursorProps {
  x: number;
  y: number;
  name: string;
  connectionId: string;
}

const Cursor = memo(({ x, y, name, connectionId }: CursorProps) => {
  const cursorRef = useRef<SVGForeignObjectElement>(null);
  const color = `hsl(${parseInt(connectionId) % 360 || 0}, 70%, 50%)`;

  useEffect(() => {
    if (cursorRef.current) {
      // GSAP handles the "gliding" between coordinates
      gsap.to(cursorRef.current, {
        x,
        y,
        duration: 0.1, // Fast but smooth
        ease: "power2.out", // Smooth deceleration
        overwrite: "auto", // Prevents animation overlapping
      });
    }
  }, [x, y]); // Runs whenever the remote coordinates update

  return (
    <foreignObject
      ref={cursorRef}
      height={50}
      width={name.length * 10 + 24}
      className="relative drop-shadow-md"
      style={{ pointerEvents: "none", position: "absolute", userSelect: "none" }}
    >
      <MousePointer2
        className="h-5 w-5"
        style={{ fill: color, color: color }}
      />
      <div
        className="absolute left-5 px-1.5 py-0.5 rounded-md text-xs text-white font-semibold whitespace-nowrap"
        style={{ backgroundColor: color }}
      >
        {name}
      </div>
    </foreignObject>
  );
});

Cursor.displayName = "Cursor";
export default Cursor;