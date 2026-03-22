"use client"

import Link from "next/link";
import { LayoutDashboard, Folder, Settings, UserCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import API from "@/lib/axios";
import Image from "next/image";
import { useAuth } from "@/providers/auth-provider";


export const Sidebar = () => {
  const { user, loading } = useAuth();

  return (
    <div className="flex flex-col h-full bg-white border-r border-[#E5E5E5] w-full pt-6 px-4">
      {/* Logo Area */}
      <div className="flex items-center gap-2 px-2 pb-6 border-b border-[#E5E5E5] mb-6">
        <div className="h-8 w-8 bg-gray-50 rounded-md flex items-center justify-center">
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
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-[8px] text-[#737373] hover:text-[#171717] hover:bg-[#FAFAFA] transition-colors"
        >
          <Folder className="h-4 w-4" />
          <span className="text-[14px]">Shared with me</span>
        </Link>
      </nav>

      {/* User Profile */}
      <div className="mt-auto border-t border-[#E5E5E5] pt-4 pb-4">
        <div className="flex items-center gap-3 px-2">
          {user?.profile_picture ? (
            <img
              src={user.profile_picture}
              alt="Profile"
              className="h-8 w-8 rounded-full object-cover border border-[#E5E5E5]"
            />
          ) : (
            <UserCircle className="h-8 w-8 text-[#737373]" />
          )}
          <div className="flex flex-col overflow-hidden">
            <span className="text-[14px] font-medium text-[#171717] truncate">
              {user?.display_name || user?.name || "User"}
            </span>
            <span className="text-[12px] text-[#737373] truncate">
              {user?.email || "user@example.com"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
