"use client"
import { Button } from "@/components/ui/button";
import { useCallback, useState } from "react";

type RectangleLayer = {
  id: string
  x: number
  y: number
  width: number
  height: number
  fill: string
}



export default function Home () {
  const [layers, setLayer] = useState<RectangleLayer[]>([
    {
      id: "1",
      x: 100,
      y: 50,
      width: 100,
      height: 100,
      fill: "red",
    }
  ])

  const [draftLayer, setDraftLayer] = useState<RectangleLayer[] | null>(null)

  const [startPoint, setStartPoint] = useState<{x: number, y: number} | null>(null)

  
  const onPointerDown = useCallback(() => {
    
  }, [])
  const onPointerUp = useCallback(() => {
    
  }, [])
  
  
  const onSvgPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    console.log("DOWN EVENT", e.clientX, e.clientY)
    setStartPoint({x: e.clientX, y: e.clientY})
  }, [])

  const onSvgPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    console.log("MOVE EVENT", e.clientX, e.clientY)
    

  }, [])

  const onSvgPointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    console.log("UP EVENT", e.clientX, e.clientY)

  }, [])



  return (
      <main className="h-screen w-full relative overflow-hidden bg-amber-100">
        <svg 
          className="absolute top-0 left-0 w-full h-full" 
          onPointerDown={onSvgPointerDown}
          onPointerMove={onSvgPointerMove}
          onPointerUp={onSvgPointerUp}
          style={{ backgroundColor: "#000" }}
        >
          {draftLayer?.map((layer: RectangleLayer, index: number) => {
           return (
            <rect 
            key={index}
            x={layer.x}
            y={layer.y}
            width={layer.width}
            height={layer.height}
            fill={layer.fill}
            />
           ) 
          })}

          {layers.map((layer) => (
            <rect 
              key={layer.id}
              x={layer.x}
              y={layer.y}
              width={layer.width}
              height={layer.height}
              fill={layer.fill}
            />
          ))}
        </svg>
      </main>
    )
  }