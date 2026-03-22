"use client"

import { useAuth } from "@/providers/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react"; // Optional icons
import { useRouter } from "next/navigation";
import API from "@/lib/axios";

export default function UserButton() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : "??";

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
      // Hard refresh or redirect to clear local state/cookies
      router.push("/login");
      router.refresh(); 
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition">
          <AvatarImage src={user?.profile_picture} alt={user?.name || "User"} />
          <AvatarFallback className="bg-muted text-xs font-bold">
            {loading ? "..." : initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem 
          onClick={handleLogout} 
          className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}