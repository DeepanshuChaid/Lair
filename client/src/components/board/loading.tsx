import { Loader } from "lucide-react";
import { InfoSkeleton } from "./info/info";
import { MembersSkeleton } from "./members/members";
import { ToolbarSkeleton } from "./toolbar/toolbar";

export default function Loading () {
    return (
        <main 
        className="h-full w-full relative bg-neutral-100 touch-none items-center justify-center">

            <Loader className="h-6 w-6 text-muted-foreground animate-spin" />
            <InfoSkeleton />
            <MembersSkeleton />
            <ToolbarSkeleton />
        </main>
    )
}