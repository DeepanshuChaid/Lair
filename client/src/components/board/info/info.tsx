"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { Poppins } from "next/font/google"
import Image from "next/image"
import Hint from "@/components/ui/hint"
import { useMutation } from "@tanstack/react-query"
import API from "@/lib/axios"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["600"],
})


export default function Info({
  id,
  title,
  onClick,
  dirtyLayers,
}: {
  id: string;
  title: string;
  onClick: () => void;
  dirtyLayers: React.MutableRefObject<
    Map<string, { layer: any; status: "update" | "delete" | "create" }>
  >;
}) {

  const router = useRouter()

  const { mutateAsync } = useMutation({
    mutationFn: async () => {
      if (dirtyLayers.current.size === 0) return; // Don't ping if no changes

      const payLoad = {
        deltas: Array.from(dirtyLayers.current.entries()).map(
          ([id, { layer, status }]) => ({
            id,
            action: status,
            layer,
          }),
        ),
      };

      console.log(payLoad);

      const { data } = await API.put(`/api/rooms/save/${id}`, payLoad);
      return data;
    },
    onSuccess: () => {
      dirtyLayers.current.clear();
    },
    onError: (err) => {
      console.error(err);
    },
  });

  // ✅ handle click properly
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // stop instant navigation

    try {
      await mutateAsync(); // ensure save completes
    } catch (e) {
      console.error(e);
    }

    onClick(); // now navigate
    router.push("/");
  };

  return (
    <div onClick={handleClick}>
      <Hint
        label="Back to Home"
        side="right"
        align="start"
        sideOffset={10}
        alignOffset={10}
      >
        <div className="absolute top-2 left-2 bg-white rounded-md p-2 shadow-md h-12 flex items-center">
          <Button className="px-2" variant="board">
            <Image src="/logo.png" alt="Logo" width={32} height={32} />
            <span
              className={cn(
                "font-semibold text-16 ml-[-6px]",
                poppins.className,
              )}
            >
              {title.slice(0, 20)}
            </span>
          </Button>
        </div>
      </Hint>
    </div>
  );
}






























// ============================= //
export function InfoSkeleton() {
    return (
        <div className="absolute top-2 left-2 bg-white rounded-md px-1.5 h-12 flex items-center shadow-md w-[300px]" >
            <Skeleton className="h-full w-full bg-muted-400" />
        </div>
    )
}