import { Skeleton } from "@/components/ui/skeleton"

const MAX_SHOWN_USER = 3;

export default function Members() {
    return(
        <div className="absolute h-12 top-2 right-2 bg-white rounded-md p-3 flex items-center shadow-md">
            <div className="flex gap-x-2">
                
            </div>
        </div>
    )
}

export function MembersSkeleton() {
    return (
        <div className="absolute h-12 top-2 right-2 bg-white rounded-md p-3 flex items-center shadow-md w-[100px]" >

            <Skeleton className="w-full h-full bg-muted-400" />
        </div>
    )
}