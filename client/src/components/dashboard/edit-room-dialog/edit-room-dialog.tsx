"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader, Globe, Lock } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import API from "@/lib/axios"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// 1. Updated schema key to match JSON
const editSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .min(3, "Title must be at least 3 characters")
    .max(50, "Title must be less than 50 characters")
    .trim(),
  description: z
    .string()
    .min(1, "Description is required")
    .min(3, "Description must be at least 3 characters")
    .max(100, "Description must be less than 100 characters")
    .trim(),
  isPublic: z.boolean(), // Updated
})

type EditFormValues = z.infer<typeof editSchema>

interface EditRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  room: any 
}

export const EditRoomDialog = ({ open, onOpenChange, room }: EditRoomDialogProps) => {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: room?.title || "",
      description: room?.description || "",
      isPublic: room?.isPublic || false, // Matches JSON
    },
  })

  // 2. Updated useEffect mapping
  useEffect(() => {
    if (open && room) {
      reset({
        title: room.title,
        description: room.description,
        isPublic: room.isPublic, // Matches JSON
      })
    }
  }, [open, room, reset])

  // 3. Fixed watch name
  const isPublicValue = watch("isPublic")

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: EditFormValues) => {
        const payload = {
          ...data,
          is_public: data.isPublic // Map it back to snake_case for the API
        };
        const res = await API.put(`/api/room/update/${room.id}`, payload);
        return res.data;
      },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] })
      toast({ title: "Success", description: "Room updated!", variant: "success" })
      onOpenChange(false)
    },
    onError: (err: any) => {
      toast({ 
        title: "Error", 
        description: err?.response?.data?.message || "Failed to update", 
        variant: "destructive" 
      })
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-6 max-w-[480px]" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Edit Room</DialogTitle>
          <DialogDescription>Update your workspace details.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-6 mt-4">
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="edit-title">Room Title</Label>
              <Input id="edit-title" {...register("title")} className={errors.title ? "border-red-500" : ""} />
              {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea id="edit-description" {...register("description")} className={errors.description ? "border-red-500 min-h-[100px]" : "min-h-[100px]"} />
              {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isPublicValue ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'}`}>
                  {isPublicValue ? <Globe size={18} /> : <Lock size={18} />}
                </div>
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Public Room</Label>
                  <p className="text-xs text-muted-foreground">
                    {isPublicValue ? "Anyone with the link can join." : "Only invited members can join."}
                  </p>
                </div>
              </div>

              {/* 4. Fixed Controller name */}
              <Controller
                control={control}
                name="isPublic"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" disabled={isPending} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="min-w-[100px] bg-[#171717]">
              {isPending ? <Loader className="animate-spin" size={18} /> : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}