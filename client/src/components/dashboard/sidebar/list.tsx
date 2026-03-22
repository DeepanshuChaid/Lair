"use client";

import { useQuery } from "@tanstack/react-query";
import API from "@/lib/axios";
import Item from "./item";

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
        <div className="space-y-2">
            {data?.rooms?.map((room: any) => (
                <Item 
                    key={room.id}
                    id={room.id}
                    name={room.title}
                    imageUrl={room.thumbnail}
                />
            ))}
        </div>
    )
}