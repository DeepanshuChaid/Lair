"use client"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Poppins } from "next/font/google"
import Image from "next/image"

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["600"],
})

export default function Info({id}: {id: string}) {


    return (
        <div className="absolute top-2 left-2 bg-white rounded-md p-2 shadow-md h-12 flex items-center">
            <Button className="px-2">
                <Image src="/logo.png" alt="Logo" width={32} height={32} />
            </Button>
        </div>
    )
}






























// ============================= //
export function InfoSkeleton() {
    return (
        <div className="absolute top-2 left-2 bg-white rounded-md px-1.5 h-12 flex items-center shadow-md w-[300px]" >
            <Skeleton className="h-full w-full bg-muted-400" />
        </div>
    )
}