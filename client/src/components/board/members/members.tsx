"use client"
import { Skeleton } from "@/components/ui/skeleton"
import API from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import UserAvatar from "../user-avatar";
import { connectionColor } from "@/lib/utils";

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
        staleTime: 5 * 60 * 1000, // Consider data "fresh" for 5 mins (won't refetch on window focus)
        refetchInterval: 10000,
        
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
                        // Pass the string ID directly now
                        borderColor={connectionColor(member.id)} 
                        name={member.name}
                        src={member.profile_picture}
                        fallback={member.name.charAt(0).toUpperCase() || "N"}
                    />
                ))}

                {hasMore && (
                    /* I removed the extra <div> wrapper so the Avatar's own styling 
                    and your gap-x-2 works correctly */
                    <UserAvatar 
                        name={moreNames} 
                        fallback={`+${moreCount}`}
                        // You might want a neutral border for the "more" bubble
                        borderColor="#E5E7EB" 
                    />
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