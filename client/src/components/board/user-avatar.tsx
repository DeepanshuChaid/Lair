import Hint from "@/components/ui/hint"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Poppins } from "next/font/google"

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["600"],
})

interface UserAvatarProp {
    src?: string,
    name: string,
    fallback?: string,
    borderColor?: string,
}

export default function UserAvatar({
    src,
    name,
    fallback,
    borderColor,
}: UserAvatarProp) {
    return (
        <Hint label={name || "Teammate"} side="bottom" sideOffset={18}>
            <Avatar
                className="h-8 w-8 border-2"
                style={{ borderColor }}
            >
                <AvatarImage src={src} />
                <AvatarFallback className={cn("text-xs font-semibold", poppins.className)}>
                    {fallback || name?.[0]?.toUpperCase() || "T"}
                </AvatarFallback>
            </Avatar>
        </Hint>
    )
}