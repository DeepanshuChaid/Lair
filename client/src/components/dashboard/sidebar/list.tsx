"use client";

import { useQuery } from "@tanstack/react-query";
import API from "@/lib/axios";

export default function List() {
    const { data, isLoading, error } = useQuery({
        queryKey: ["rooms"],
        queryFn: async () => {
            const res = await API.get("/api/room/get");
            return res.data;
        },
    });

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    if (data?.length === 0) {
        return null
    }
    
    return (
        <div>
            {data?.rooms?.map((room: any) => (
                <div key={room.id}>
                    <h2>{room.title}</h2>
                </div>
            ))}
        </div>
    )
}