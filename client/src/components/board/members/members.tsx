import { Skeleton } from "@/components/ui/skeleton"



export default function Members() {
    return(
        <div className="absolute h-12 top-2 right-2 bg-white rounded-md p-3 flex items-center shadow-md">
            List of members

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