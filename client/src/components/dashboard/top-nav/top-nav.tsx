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

export const TopNav = () => {
  const { user } = useAuth();
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
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

  const handleUploadPicture = async () => {

  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E5E5E5] bg-[#FCFCFC] flex items-center justify-between px-4 sm:px-6 py-3">
      {/* Left: Logo */}
      <Link href="/" className="flex items-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/20 rounded-md">
        <div className="h-8 w-8 bg-[#FCFCFC] rounded-[10.92px] flex items-center justify-center ">
          <Image src="/logo.png" alt="Logo" width={48} height={48} />
        </div>
        <span className="font-bold text-[#171717] tracking-tight text-lg">Lair</span>
      </Link>

      {/* Right: Actions */}
      <div className="flex items-center gap-3 sm:gap-4">
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
    </header>
  );
};
