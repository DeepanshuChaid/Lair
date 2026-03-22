import { cn } from "@/lib/utils"
import Image from "next/image"
import Hint from "./hint"

export default function Item({ id, name, imageUrl }: { id: string, name: string, imageUrl: string }) {


    return (
        <div className="aspect-square relative py-2">
            <Hint label={name} side="right" align="center" sideOffset={10} alignOffset={0} >
                <Image
                    src={imageUrl}
                    alt={name}
                    fill
                    className={cn("rounded-md cursor-pointer opacity-75 hover:opacity-100 transition")}
                />
                <Avatar className="aspect-square relative py-2">
                    <AvatarImage src={user?.profile_picture} alt={user?.name || "User"} />
                    <AvatarFallback className="bg-muted text-xs font-bold">
                        {loading ? "..." : initials}
                    </AvatarFallback>
                </Avatar>
            </Hint>
        </div>
    )
}