import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { Poppins } from "next/font/google"
import Image from "next/image"
import Hint from "@/components/ui/hint"

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["600"],
})


export default function Info({id, title}: {id: string, title: string}) {


    return (
        <Link href="/">
            <Hint  label="Back to Home" side="right" align="start" sideOffset={10} alignOffset={10}>
                <div className="absolute top-2 left-2 bg-white rounded-md p-2 shadow-md h-12 flex items-center">
                    <Button className="px-2" variant="board">
                            <Image src="/logo.png" alt="Logo" width={32} height={32} />
                            <span className={cn("font-semibold text-16 ml-[-6px]", poppins.className)}>
                                {title.slice(0, 20)}
                            </span>
                    </Button>
                </div>
            </Hint>
        </Link>
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