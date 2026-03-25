"use client"
import { Skeleton } from "@/components/ui/skeleton"
import API from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import UserAvatar from "../user-avatar";

const MAX_SHOWN_USER = 2;

interface MemberType {
    id: string,
    name: string,
    profile_picture: string,
    email: string,
}

export default function Members({id}: {id: string}) {
    const {data: members, isLoading} = useQuery<MemberType[]>({
        queryKey: [`members:${id}`],
        queryFn: async () => {
            const {data} = await API.get(`/api/room/get-members/${id}`) 
            return data.room.members
        },
    })
    
    if (isLoading) return <MembersSkeleton />

    // Safety check: ensure members exists and is an array
    const allMembers = members || [];
    const shownMembers = allMembers.slice(0, MAX_SHOWN_USER);
    const hasMore = allMembers.length > MAX_SHOWN_USER;
    const moreCount = allMembers.length - MAX_SHOWN_USER;

    // Create a string of names for the overflow hint
    const moreNames = allMembers
        .slice(MAX_SHOWN_USER)
        .map(m => m.name)
        .join(", ");

    return (
        <div className="absolute h-12 top-2 right-2 bg-white rounded-md p-3 flex items-center shadow-md">
            <div className="flex gap-x-2 items-center">
                {shownMembers.map((member: MemberType) => (
                    <UserAvatar 
                        key={member.id}
                        name={member.name}
                        src={member.profile_picture}
                        fallback={member.name.charAt(0).toUpperCase() || "N"}
                    />
                ))}

                {hasMore && (
                    <div className="bg-gray-100 border-2 border-white"> 
                        <UserAvatar 
                            name={`${moreNames}`} // This will show in your "hint" label
                            fallback={`+${moreCount}`}
                            // Add a custom class if you want the +X bubble to look different
                        />
                    </div>
                )}
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