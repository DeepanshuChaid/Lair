// app/providers/auth-provider.tsx
"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import API from "@/lib/axios"
import { toast } from "@/hooks/use-toast"

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
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const queryClient = useQueryClient()

  const fetchUser = async () => {
    try {
      setLoading(true)
      const { data } = await API.get("/api/user") // your endpoint
      setUser(data.user)
    //   toast({
    //     title: "Success",
    //     description: JSON.stringify(data.user.profile_picture),
    //     variant: "success",
    //   });
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refetchUser: () => {
          queryClient.invalidateQueries({ queryKey: ["authUser"] })
          fetchUser()
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
