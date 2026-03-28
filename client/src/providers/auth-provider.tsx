// app/providers/auth-provider.tsx
"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import API from "@/lib/axios"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

type User = {
  id: string
  name: string
  email: string
  profile_picture: string
}

type AuthContextType = {
  user: User | null
  loading: boolean
  refetchUser: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()

  const router = useRouter()

  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data } = await API.get("/api/user")
      return data.user
    },
    // --- CACHING CONFIG ---
    staleTime: 1000 * 60 * 5, // Data is considered fresh for 5 minutes
    gcTime: 1000 * 60 * 30,    // Keep the data in cache for 30 mins even if unused
    retry: false,              // Don't spam the API if the user isn't logged in
    refetchOnWindowFocus: false, // Prevents refetching every time you switch tabs
  })


  // 2. Move the navigation into a side effect
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);


  return (
    <AuthContext.Provider
      value={{
        user: user,
        loading: isLoading,
        refetchUser: () => {
          queryClient.invalidateQueries({ queryKey: ["user"] })
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
