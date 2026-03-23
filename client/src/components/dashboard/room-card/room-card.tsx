"use client"

import { useState } from "react"
import { MoreVertical, Trash2, Globe, Lock, UserPlus, Loader, Pencil, ImagePlus } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import API from "@/lib/axios"
import { Room } from "@/app/(dashboard)/page"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { EditRoomDialog } from "../edit-room-dialog/edit-room-dialog"
import UploadThumbnail from "../upload-thumbnail/upload-thumbnail"

// --- 1. Define the Schema ---
const inviteSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
})

type InviteFormValues = z.infer<typeof inviteSchema>

export const RoomCard = ({ room }: { room: Room }) => {
  const queryClient = useQueryClient()
  const [isDeleting, setIsDeleting] = useState(false)
  const [memberDialogOpen, setMemberDialogOpen] = useState(false)

  const [editRoomDialogOpen, setEditRoomDialogOpen] = useState(false);

  const [showUploadDialog, setShowUploadDialog] = useState(false)


  // --- 2. Initialize Form ---
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "" },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await API.delete(`/api/room/delete/${room.id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] })
      toast({ title: "Success", description: "Room deleted successfully", variant: "success" })
    },
  })

  const addMemberMutation = useMutation({
    mutationFn: async (data: InviteFormValues) => {
      const res = await API.post(`/api/ws/add-member/${room.id}`, data)
      return res.data
    },
    onSuccess: (_, variables) => {
      toast({ 
        title: "Invited!", 
        description: `${variables.email} Added to the Room`, 
        variant: "success" 
      })
      setMemberDialogOpen(false)
      reset() // Reset form after success
    },
    onError: (err: any) => {
      toast({ 
        title: "Error", 
        description: err?.response?.data?.message || "Failed to add member", 
        variant: "destructive" 
      })
    }
  })

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diffInSeconds < 60) return "just now"
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    return `${Math.floor(diffInHours / 24)}d ago`
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Are you sure?")) return
    setIsDeleting(true)
    await deleteMutation.mutateAsync()
    setIsDeleting(false)
  }

  // --- 3. Handle Form Submission ---
  const onSubmit = (data: InviteFormValues) => {
    addMemberMutation.mutate(data)
  }

  return (
    <>
      <div className="group flex flex-col bg-white rounded-[12px] border border-[#E5E5E5] overflow-hidden hover:shadow-md transition-all cursor-pointer">
        <div className="relative aspect-video bg-[#FAFAFA] border-b border-[#E5E5E5] overflow-hidden">
          {room.thumbnail ? (
            <img src={room.thumbnail} alt={room.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-20 bg-slate-100">
              <Globe size={48} className="text-slate-400" />
            </div>
          )}

          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-[#E5E5E5] shadow-sm">
            {room.isPublic ? <Globe size={12} className="text-blue-600" /> : <Lock size={12} className="text-gray-600" />}
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#171717]">
              {room.isPublic ? "Public" : "Private"}
            </span>
          </div>
        </div>

        <div className="flex flex-col p-4 gap-3">
          <div className="flex items-start justify-between">
            <div className="flex flex-col overflow-hidden">
              <h3 className="text-[#171717] font-semibold text-[15px] truncate leading-tight">{room.title}</h3>
              <p className="text-[#737373] text-[12px] line-clamp-1 mt-1">{room.description}</p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#737373] hover:bg-[#FAFAFA]" disabled={isDeleting}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px]">

                <DropdownMenuItem 
                  className="gap-2 cursor-pointer" 
                  onClick={(e) => {
                    e.stopPropagation()
                    setMemberDialogOpen(true)
                  }}
                >
                  <UserPlus className="h-4 w-4" />
                  Add Member
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                    {/* EDIT BUTTON */}
                    <DropdownMenuItem 
                      className="gap-2 cursor-pointer" 
                      onSelect={(e) => {
                        e.preventDefault();
                        setEditRoomDialogOpen(true); // Open the edit dialog
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit Room
                    </DropdownMenuItem>
                <DropdownMenuSeparator/>

                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault(); // Prevents dropdown from closing weirdly
                    setShowUploadDialog(true);
                  }}
                  className="cursor-pointer gap-2"
                >
                  <ImagePlus className="h-4 w-4 text-[#737373]" />
                  <span>Upload Thumbnail</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600 cursor-pointer" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                  Delete Room
                </DropdownMenuItem>

              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#F5F5F5]">
            <span className="text-[#A3A3A3] text-[11px] font-medium">
              Created {getRelativeTime(room.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* UPLOAD THUMBNIAL DIALOG */}
      <UploadThumbnail
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        id={room.id}
      />

      {/* THE NEW EDIT DIALOG */}
    <EditRoomDialog 
      open={editRoomDialogOpen} 
      onOpenChange={setEditRoomDialogOpen} 
      room={room} 
    />

      {/* --- ADD MEMBER DIALOG --- */}
      <Dialog 
        open={memberDialogOpen} 
        onOpenChange={(open) => {
          setMemberDialogOpen(open)
          if (!open) reset() // Clear errors and input when closing
        }}
      >
        <DialogContent className="sm:max-w-[425px]" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>
              Invite someone to <span className="font-semibold text-[#171717]">"{room.title}"</span> by their email address.
            </DialogDescription>
          </DialogHeader>


          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email" className={errors.email ? "text-red-500" : ""}>Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                {...register("email")}
                className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                autoFocus
              />
              {errors.email && (
                <p className="text-red-500 text-xs font-medium">{errors.email.message}</p>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setMemberDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={addMemberMutation.isPending}
                className="bg-[#171717] hover:bg-[#262626] min-w-[100px]"
              >
                {addMemberMutation.isPending ? (
                  <Loader className="animate-spin h-4 w-4" />
                ) : (
                  "Send Invite"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}