"use client"

import { useState } from "react"
import { MoreVertical, Settings, Trash2 } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import API from "@/lib/axios"
import { Room } from "@/app/(dashboard)/page"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export const RoomCard = ({ room }: { room: Room }) => {
  const queryClient = useQueryClient()
  const [isDeleting, setIsDeleting] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await API.delete(`/api/room/delete/${room.id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] })
    },
  })

  // Format "Created [Time ago]"
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return "just now"
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDeleting(true)
    await deleteMutation.mutateAsync()
    setIsDeleting(false)
  }

  return (
    <div className="group flex flex-col bg-white rounded-[12px] border border-[#E5E5E5] overflow-hidden hover:shadow-sm transition-all cursor-pointer">
      {/* Thumbnail Area (16:9) */}
      <div className="relative aspect-video bg-[#FAFAFA] border-b border-[#E5E5E5] overflow-hidden">
        {room.thumbnail ? (
          <img 
            src={room.thumbnail} 
            alt={room.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-30">
            {/* Geometric pattern fallback */}
            <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
              <g fill="none" fillRule="evenodd">
                <g fill="#171717" fillOpacity="0.2">
                  <path d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/>
                </g>
              </g>
            </svg>
          </div>
        )}
        
        {/* Placeholder for API reserved upload area */}
        <div className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
           {/* Add your upload logic using POST /api/room/uploadthumbnail/:id here */}
        </div>
      </div>

      {/* Bottom Information */}
      <div className="flex items-center justify-between p-4">
        <div className="flex flex-col overflow-hidden">
          <h3 className="text-[#171717] font-medium text-[14px] truncate leading-tight mb-1">
            {room.title}
          </h3>
          <span className="text-[#737373] text-[12px]">
            Created {getRelativeTime(room.created_at)}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[#737373] hover:text-[#171717] hover:bg-[#FAFAFA] focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={isDeleting}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px] bg-white rounded-[8px] border-[#E5E5E5] p-1 shadow-sm">
            <DropdownMenuItem 
              className="flex items-center gap-2 text-[13px] text-red-600 hover:bg-red-50 cursor-pointer rounded-[6px] focus:text-red-600"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
