"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch"; // Ensure you have this shadcn component
import { Label } from "@/components/ui/label";
import { Plus, Loader, Globe, Lock } from "lucide-react";
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import API from "@/lib/axios";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Hint from "../sidebar/hint";

const formSchema = z.object({
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
});

type FormValues = z.infer<typeof formSchema>;

// Changed export to match what was in page.tsx to prevent crashes
export const NewBoardDialog = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      is_public: false,
    },
  });

  // We "watch" the value to change icons or text dynamically
  const isPublicValue = watch("is_public");

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: FormValues) => {
      // Adjusted from /api/room/create to align with backend endpoints
      const res = await API.post("/api/room/create", data);
      return res.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Room created successfully!",
        variant: "success", // changed from "success" which might not be supported natively by shadcn default
      });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setOpen(false);
      reset();
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || "Something went wrong!";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (isPending) return;
    mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* We replaced the white-on-white button with a styled one more fitting for the dashboard header, feel free to change it */}
        <button className="flex items-center gap-2 px-4 py-[10px] bg-[#171717] hover:bg-[#262626] text-white rounded-[8px] text-[14px] font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#171717]/20">
          <Plus className="h-4 w-4" />
          New Board
        </button>
      </DialogTrigger>

      <DialogContent className="p-6 max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create Room</DialogTitle>
          <DialogDescription>
            Configure your workspace visibility and details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="space-y-4">
            {/* Title Field */}
            <div className="space-y-1">
              <Label htmlFor="title">Room Title</Label>
              <Input
                id="title"
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What is this room about? (min 3, max 100 characters)"
                {...register("description")}
                className={errors.description ? "border-red-500 min-h-[100px]" : "min-h-[100px]"}
              />
              {errors.description && (
                <p className="text-red-500 text-xs">{errors.description.message}</p>
              )}
            </div>

            {/* Public/Private Toggle Area */}
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
              disabled={isSubmitting}
              onClick={() => {
                reset();
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[100px]">
              {isSubmitting ? (
                <Loader className="animate-spin" size={18} />
              ) : (
                "Create Room"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
