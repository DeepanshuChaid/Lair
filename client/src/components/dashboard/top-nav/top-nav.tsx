"use client";

import Link from "next/link";
import Image from "next/image";
import { UserCircle, LogOut, ImagePlus } from "lucide-react";
import API from "@/lib/axios";
import { useAuth } from "@/providers/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NewBoardDialog } from "@/components/dashboard/new-board-dialog/new-board-dialog";
import { useState } from "react";
import { UploadProfilePicture } from "../upload-profile-picture/upload-profile-picture";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const TopNav = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user } = useAuth();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
      queryClient.setQueryData(["user"], null); // Manually clear the cache
      queryClient.removeQueries(); // Optional: wipe everything if it's a deep clean
      window.location.href = "/login";
      toast({
        title: "Success",
        description: "Logout successful",
        variant: "success",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleUploadPicture = async () => {};

  const joinByCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await API.get("/api/room/get-id", {
        params: { joinCode: code },
      });
      return res.data;
    },
    onSuccess: (data) => {
      const roomId = data?.roomId || data?.data?.roomId || data?.room?.id;
      if (!roomId) {
        toast({
          title: "Error",
          description: "Room id not found for this code",
          variant: "destructive",
        });
        return;
      }
      setJoinDialogOpen(false);
      setJoinCode("");
      router.push(`/room/${roomId}`);
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to find room",
        variant: "destructive",
      });
    },
  });

  const handleJoinByCode = () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      toast({
        title: "Code required",
        description: "Enter a join code",
        variant: "destructive",
      });
      return;
    }
    joinByCodeMutation.mutate(code);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E5E5E5] bg-[#FCFCFC] flex items-center justify-between px-4 sm:px-6 py-3">
      {/* Left: Logo */}
      <Link
        href="/"
        className="flex items-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/20 rounded-md"
      >
        <div className="h-8 w-8 bg-[#FCFCFC] rounded-[10.92px] flex items-center justify-center ">
          <Image src="/logo.png" alt="Logo" width={48} height={48} />
        </div>
        <span className="font-bold text-[#171717] tracking-tight text-lg">
          Lair
        </span>
      </Link>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          variant="outline"
          className="h-10 px-2.5 text-xs sm:text-sm"
          onClick={() => setJoinDialogOpen(true)}
        >
          Join Room
        </Button>
        {/* HI */}
        {/* New Board Modal Trigger */}
        <NewBoardDialog />

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center justify-center rounded-full hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E5E5E5]">
              <Avatar className="h-[42px] w-[42px] border border-[#E5E5E5] shrink-0">
                <AvatarImage src={user?.profile_picture || ""} alt="Profile" />
                <AvatarFallback>
                  <UserCircle className="h-full w-full text-[#737373]" />
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56" align="end" side="bottom">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-[14px] font-medium leading-none text-[#171717] truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-[12px] leading-none text-[#737373] truncate mt-1">
                  {user?.email || "user@example.com"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault(); // Prevents dropdown from closing weirdly
                setShowUploadDialog(true);
              }}
              className="cursor-pointer gap-2"
            >
              <ImagePlus className="h-4 w-4 text-[#737373]" />
              <span>Upload Picture</span>
            </DropdownMenuItem>

            <UploadProfilePicture
              open={showUploadDialog}
              onOpenChange={setShowUploadDialog}
            />

            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join Room</DialogTitle>
            <DialogDescription>
              Enter room join code to open the room.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Enter join code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleJoinByCode();
              }
            }}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setJoinDialogOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleJoinByCode}
              disabled={joinByCodeMutation.isPending}
              type="button"
            >
              {joinByCodeMutation.isPending ? "Joining..." : "Join"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
};
