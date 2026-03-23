"use client"

import Link from "next/link";
import { LayoutDashboard, Folder, Settings, UserCircle, LogOut, ImagePlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import API from "@/lib/axios";
import Image from "next/image";
import { useAuth } from "@/providers/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Sidebar = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
      window.location.href = "/login";
      toast({
        title: "Success",
        description: "Logout successful",
        variant: "success",
      })
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-[#E5E5E5] w-full pt-6 px-4">
      {/* Logo Area */}
      <div className="flex items-center gap-2 px-2 pb-6 border-b border-[#E5E5E5] mb-6">
        <div className="h-8 w-8 bg-gray-50 rounded-md flex items-center justify-center bg-[#FCFCFC] 
  rounded-[10.92px] 
  shadow-[0px_4px_4px_rgba(0,0,0,0.15),inset_0px_7.78px_3px_rgba(255,255,255,0.15)]">
          {/* <span className="text-white font-bold text-lg leading-none">L</span> */}
          <Image src="/logo.png" alt="Logo" width={48} height={48} />
        </div>
        <span className="font-bold text-[#171717] tracking-tight">Lair</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-2 flex-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-[8px] bg-[#FAFAFA] text-[#171717] font-medium transition-colors"
        >
          <LayoutDashboard className="h-4 w-4" />
          <span className="text-[14px]">My Boards</span>
        </Link>
        {/* <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-[8px] text-[#737373] hover:text-[#171717] hover:bg-[#FAFAFA] transition-colors"
        >
          <Folder className="h-4 w-4" />
          <span className="text-[14px]">Shared with me</span>
        </Link> */}
      </nav>

      {/* User Profile */}
      {/* User Profile & Dropdown */}
      <div className="mt-auto border-t border-[#E5E5E5] pt-4 pb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg hover:bg-[#FAFAFA] transition-colors text-left focus:outline-none focus:ring-2 focus:ring-[#E5E5E5]">
              <div className="flex items-center gap-3 overflow-hidden">
                <Avatar className="h-8 w-8 border border-[#E5E5E5] flex-shrink-0">
                  <AvatarImage src={user?.profile_picture || ""} alt="Profile" />
                  <AvatarFallback>
                    <UserCircle className="h-full w-full text-[#737373]" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[14px] font-medium text-[#171717] truncate">
                    {user?.name || "User"}
                  </span>
                  <span className="text-[12px] text-[#737373] truncate">
                    {user?.email || "user@example.com"}
                  </span>
                </div>
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56" align="end" side="top">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => console.log("Upload Picture")} className="cursor-pointer gap-2">
              <ImagePlus className="h-4 w-4 text-[#737373]" />
              <span>Upload Picture</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 gap-2">
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>


    </div>
  );
};
