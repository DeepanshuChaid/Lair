"use client"

import { useQuery } from "@tanstack/react-query"
import API from "@/lib/axios"
import { RoomCard } from "@/components/dashboard/room-card/room-card"
import { RoomSkeleton } from "@/components/dashboard/room-skeleton/room-skeleton";
import Image from "next/image";


export interface Room {
    id: string;
    title: string;
    description: string;
    isPublic: boolean;
    thumbnail?: string;
    created_at: string;
    updated_at: string;
    owner_id: string;
}

const fetchRooms = async (): Promise<{rooms: Room[]}> => {
    const { data } = await API.get("/api/room/get")
    return data
}

export default function DashboardPage() {
    const { data, isLoading } = useQuery({
        queryKey: ["rooms"],
        queryFn: fetchRooms,
    })

    return (
        <div className="flex-1 p-6 max-w-7xl mx-auto flex flex-col gap-6">

            {/* Main Content */}
            {isLoading ? (
                <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Render 6 skeletons as placeholders */}
                    {Array.from({ length: 6 }).map((_, i) => (
                        <RoomSkeleton key={i} />
                    ))}
                </div>
                    </>
            ) : !data || !data.rooms || data.rooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 gap-4">
                    {/* <div className="h-24 w-24 rounded-full bg-white border border-[#E5E5E5] flex items-center justify-center">
                        <span className="text-[#737373] font-mono text-2xl">0</span>
                    </div> */}
                    <Image src="/empty.png" alt="Empty" width={320} height={320} className="h-auto w-auto md:w-96 lg:w-120" />
                    <p className="text-[#171717] font-medium">No boards yet</p>
                    <p className="text-[#737373] text-[14px]">Create your first board to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {data?.rooms?.map((room: Room) => (
                        <RoomCard key={room.id} room={room} />
                    ))}
                </div>
            )}
        </div>
    )
}

