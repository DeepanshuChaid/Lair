"use client";

import { useState } from "react";
import {
  MoreVertical,
  Trash2,
  Globe,
  Lock,
  UserPlus,
  Loader,
  Pencil,
  ImagePlus,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import API from "@/lib/axios";
import { Room } from "@/app/(dashboard)/page";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { EditRoomDialog } from "../edit-room-dialog/edit-room-dialog";
import UploadThumbnail from "../upload-thumbnail/upload-thumbnail";
import Link from "next/link";
import { ManageMembers } from "../manage-members/manage-members";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const MOCK_MEMBERS = [
  { id: "1", name: "Alice Johnson", email: "alice@example.com", image: "" },
  { id: "2", name: "Bob Smith", email: "bob@example.com", image: "" },
  { id: "3", name: "Charlie Day", email: "charlie@@sunny.com", image: "" },
];

// --- 1. Define the Schema ---
const inviteSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export const RoomCard = ({ room }: { room: Room }) => {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);

  const [editRoomDialogOpen, setEditRoomDialogOpen] = useState(false);

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [sharePanelOpen, setSharePanelOpen] = useState(false);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // --- 2. Initialize Form ---
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "" },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await API.delete(`/api/room/delete/${room.id}?title=${room.title}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast({
        title: "Success",
        description: "Room deleted successfully",
        variant: "success",
      });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async (data: InviteFormValues) => {
      const res = await API.post(`/api/ws/add-member/${room.id}`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Invited!",
        description: `${variables.email} Added to the Room`,
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: [`members:${room.id}`] });
      setMemberDialogOpen(false);
      reset(); // Reset form after success
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to add member",
        variant: "destructive",
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (data: InviteFormValues) => {
      const res = await API.delete(
        `/api/ws/remove-member/${room.id}`,
        data as any,
      );
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Removed!",
        description: `${variables.email} Removed from the Room`,
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: [`members:${room.id}`] });
      setMemberDialogOpen(false);
      reset(); // Reset form after success
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Failed to remove the member",
        variant: "destructive",
      });
    },
  });

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return "just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure?")) return;
    setIsDeleting(true);
    await deleteMutation.mutateAsync();
    setIsDeleting(false);
  };

  // --- 3. Handle Form Submission ---
  const onSubmit = (data: InviteFormValues) => {
    addMemberMutation.mutate(data);
  };

  return (
    <>
      {/* 2. THE STRETCHED LINK: Covers the whole card */}
      <div className="group relative flex flex-col bg-white rounded-[12px] border border-[#E5E5E5] overflow-hidden hover:shadow-md transition-all cursor-pointer">
        {/* 1. THE STRETCHED LINK: MUST BE INSIDE THE RELATIVE DIV */}
        <Link
          href={`/room/${room.id}?title=${room.title}`}
          className="absolute inset-0 z-10" // z-10 covers the card
          aria-label={`View room: ${room.title}`}
        />

        {/* 2. THUMBNAIL AREA */}
        <div className="relative aspect-video bg-[#FAFAFA] border-b border-[#E5E5E5] overflow-hidden">
          {room.thumbnail ? (
            <img
              src={room.thumbnail}
              alt={room.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-20 bg-slate-100">
              <Globe size={48} className="text-slate-400" />
            </div>
          )}

          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-[#E5E5E5]">
            {room.isPublic ? (
              <Globe size={12} className="text-blue-600" />
            ) : (
              <Lock size={12} className="text-gray-600" />
            )}
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#171717]">
              {room.isPublic ? "Public" : "Private"}
            </span>
          </div>
        </div>

        <div className="flex flex-col p-4 gap-3">
          <div className="flex items-start justify-between">
            <div className="flex flex-col overflow-hidden">
              <h3 className="text-[#171717] font-semibold text-[15px] truncate leading-tight">
                {room.title}
              </h3>
              <p className="text-[#737373] text-[12px] line-clamp-1 mt-1">
                {room.description}
              </p>
            </div>

            {/* 3. DROPDOWN: MUST HAVE A HIGHER Z-INDEX THAN THE LINK */}
            <div className="relative z-20">
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[#737373] hover:bg-[#FAFAFA]"
                    disabled={isDeleting}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px]">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setMemberDialogOpen(true);
                    }}
                  >
                    <UserPlus className="h-4 w-4" />
                    Manage Members
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
                  <DropdownMenuSeparator />

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

                  <DropdownMenuItem
                    className="gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Room
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#F5F5F5]">
            <span className="text-[#A3A3A3] text-[11px] font-medium">
              Created {getRelativeTime(room.created_at)}
            </span>
            <div className="relative z-20">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 px-2 text-[11px]"
                onClick={(e) => {
                  e.stopPropagation();
                  setSharePanelOpen(true);
                }}
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </Button>
            </div>
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
      <ManageMembers
        open={memberDialogOpen}
        onOpenChange={setMemberDialogOpen}
        roomId={room.id}
        roomTitle={room.title}
      />

      <Sheet open={sharePanelOpen} onOpenChange={setSharePanelOpen}>
        <SheetContent side="right" className="w-[90vw] sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Share Room</SheetTitle>
            <SheetDescription>
              Share these details with members to join this room.
            </SheetDescription>
          </SheetHeader>

          <div className="px-4 pb-4 space-y-4 mt-6">
            {/* Room ID Section */}
            <div className="space-y-1">
              <Label className="text-xs text-[#737373]">Room Link</Label>
              <div className="flex gap-2">
                <div className="flex-1 rounded-md border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2 text-sm break-all">
                  https://lair2509.vercel.app/room/{room.id}?title={room.title}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() =>
                    copyToClipboard(
                      `https://lair2509.vercel.app/room/${room.id}?title=${room.title}`,
                      "id",
                    )
                  }
                >
                  {copiedField === "id" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Join Code Section */}
            <div className="space-y-1">
              <Label className="text-xs text-[#737373]">Join Code</Label>
              <div className="flex gap-2">
                <div className="flex-1 rounded-md border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2 text-sm font-mono">
                  {room.join_code || "Not available"}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  disabled={!room.join_code}
                  onClick={() =>
                    copyToClipboard(room.join_code as string, "code")
                  }
                >
                  {copiedField === "code" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
