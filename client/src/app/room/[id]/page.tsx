import Canvas from "@/components/board/canvas/canvas";
import { use } from "react";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div className="w-full h-full flex items-center justify-center">
      {/* <h1 className="text-3xl font-bold">{id}</h1> */}
      <Canvas />
    </div>
  )
}