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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  is_public: z.boolean(),
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
      is_public: room?.is_public || false,
    },
  })

  // Keep form in sync when room data changes or dialog opens
  useEffect(() => {
    if (open && room) {
      reset({
        title: room.title,
        description: room.description,
        is_public: room.is_public,
      })
    }
  }, [open, room, reset])

  const isPublicValue = watch("is_public")

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: EditFormValues) => {
      const res = await API.patch(`/api/room/update/${room.id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] })
      toast({ 
        title: "Success", 
        description: "Room updated successfully!", 
        variant: "success" 
      })
      onOpenChange(false)
    },
    onError: (err: any) => {
      toast({ 
        title: "Error", 
        description: err?.response?.data?.message || "Something went wrong!", 
        variant: "destructive" 
      })

      console.error(err.data)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-6 max-w-[480px]" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Edit Room</DialogTitle>
          <DialogDescription>
            Update your workspace visibility and details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-6 mt-4">
          <div className="space-y-4">
            {/* Title Field */}
            <div className="space-y-1">
              <Label htmlFor="edit-title">Room Title</Label>
              <Input
                id="edit-title"
                placeholder="e.g. Design Sprint"
                {...register("title")}
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-red-500 text-xs">{errors.title.message}</p>
              )}
            </div>

            {/* Description Field */}
            <div className="space-y-1">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="What is this room about?"
                {...register("description")}
                className={errors.description ? "border-red-500 min-h-[100px]" : "min-h-[100px]"}
              />
              {errors.description && (
                <p className="text-red-500 text-xs">{errors.description.message}</p>
              )}
            </div>

            {/* Public/Private Toggle Area (Matches reference) */}
            <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isPublicValue ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'}`}>
                  {isPublicValue ? <Globe size={18} /> : <Lock size={18} />}
                </div>
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Public Room</Label>
                  <p className="text-xs text-muted-foreground">
                    {isPublicValue
                      ? "Anyone with the link can join."
                      : "Only invited members can join."}
                  </p>
                </div>
              </div>

              <Controller
                control={control}
                name="is_public"
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
            <Button
              variant="outline"
              type="button"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="min-w-[100px] bg-[#171717]">
              {isPending ? (
                <Loader className="animate-spin" size={18} />
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}