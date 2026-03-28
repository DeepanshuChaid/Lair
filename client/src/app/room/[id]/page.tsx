"use client"
import Canvas from "@/components/board/canvas/canvas";
import API from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { use, useEffect, useRef } from "react";



export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams()
  const title = searchParams.get('title')

  const dirtyLayers = useRef(new Map<string, { layer: any, status: 'update' | 'delete' | 'create' }>()) 

  const {mutate} = useMutation({
    mutationFn: async() => {
      const payLoad = {
        deltas: Array.from(dirtyLayers.current.entries()).map(([id, { layer, status }]) => ({
          id,
          action: status,
          layer
        }))
      }

      const {data} = await API.put(`/api/rooms/save/${id}`, payLoad)
      return data
    },
    onSuccess: () => {
      console.log(dirtyLayers)
      dirtyLayers.current.clear()
    },
    onError: (err) => {
      console.log(dirtyLayers)
      console.error(err)
    }
  })

  useEffect(() => {
    const interval = setInterval(() => {
      mutate()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

//   {
//   "deltas": [
//     {
//       "id": "layer-1",
//       "action": "create",
//       "layer": {
//         "type": 1,
//         "x": 100,
//         "y": 150,
//         "width": 200,
//         "height": 100,
//         "fill": { "r": 38, "g": 38, "b": 38 }
//       }
//     },
//     {
//       "id": "path-5",
//       "action": "update",
//       "layer": {
//         "type": 5,
//         "points": [[10, 10, 0.5], [15, 20, 0.6]],
//         "fill": { "r": 255, "g": 0, "b": 0 }
//       }
//     },
//     {
//       "id": "layer-0",
//       "action": "delete",
//       "layer": null
//     }
//   ]
// }

  return (
    <div className="w-full h-full flex items-center justify-center">
      {/* <h1 className="text-3xl font-bold">{id}</h1> */}
      <Canvas id={id} title={title || ""} dirtyLayers={dirtyLayers} />
    </div>
  )
}