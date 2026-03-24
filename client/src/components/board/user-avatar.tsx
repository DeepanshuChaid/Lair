import Hint from "@/components/ui/hint"
import { Button } from "../ui/button"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Poppins } from "next/font/google"

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["600"],
})

interface UserAvatarProp {
    src?: string,
    name: string,
    borderColor?: string,
}

export default function UserAvatar() {
    return (
        <>
        </>
    )
}