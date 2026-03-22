import { cn } from "@/lib/utils"
import Image from "next/image"

export default function Item({id, name, imageUrl}: {id: string, name: string, imageUrl: string}) {
    

    return (
        <div className="aspect-square relative">
            <Image
                src={imageUrl}
                alt={name}
                fill
                className={cn("rounded-md cursor-pointer opacity-75 hover:opacity-100 transition")}
            />
        </div>
    )
}