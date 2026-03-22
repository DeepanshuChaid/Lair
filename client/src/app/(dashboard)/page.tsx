"use client"

import { useQuery } from "@tanstack/react-query"
import API from "@/lib/axios"
import { RoomCard } from "@/components/dashboard/room-card/room-card"
import { NewBoardDialog } from "@/components/dashboard/new-board-dialog/new-board-dialog"

export interface Room {
    id: string;
    title: string;
    description: string;
    is_public: boolean;
    thumbnail_url?: string;
    created_at: string;
    updated_at: string;
    owner_id: string;
}

const fetchRooms = async (): Promise<Room[]> => {
    const { data } = await API.get("/api/room/get")
    return data
}

export default function DashboardPage() {
    const { data, isLoading } = useQuery({
        queryKey: ["rooms"],
        queryFn: fetchRooms,
    })

    return (
        <div className="flex-1 h-full p-6 max-w-7xl mx-auto flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between sticky top-0 bg-[#FAFAFA] z-10 py-2">
                <h1 className="text-[#171717] font-mono text-xl font-medium tracking-tight">
                    Dashboard
                </h1>
                <NewBoardDialog />
            </div>

            {/* Main Content */}
            {isLoading ? (
                <div className="flex items-center justify-center flex-1">
                    <p className="text-[#737373] text-[14px]">Loading rooms...</p>
                </div>
            ) : !data || data.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 gap-4">
                    <div className="h-24 w-24 rounded-full bg-white border border-[#E5E5E5] flex items-center justify-center">
                        <span className="text-[#737373] font-mono text-2xl">0</span>
                    </div>
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