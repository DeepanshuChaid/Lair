"use client"

import { Trash2, Loader, UserPlus } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import API from "@/lib/axios"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/hooks/use-toast"

const inviteSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
})

type InviteFormValues = z.infer<typeof inviteSchema>

interface Member {
  id: string
  name: string
  email: string
  profile_picture: string // Matches your Go 'profile_picture' field
  role: string
}

interface ManageMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roomId: string
  roomTitle: string
}


export const ManageMembers = ({ open, onOpenChange, roomId, roomTitle }: ManageMembersDialogProps) => {
  const queryClient = useQueryClient()

  const { data, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["members", roomId],
    queryFn: async () => {
      const res = await API.get(`/api/room/get-members/${roomId}`)
      return res.data?.room ? res.data.room : res.data
    },
    enabled: open,
    placeholderData: (previousData) => previousData, // Prevents the "No members" flicker
  })

  const membersList: Member[] = data?.members || []

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "" },
  })

  // --- 2. Add Member ---
  const addMemberMutation = useMutation({
    mutationFn: async (formData: InviteFormValues) => {
      return await API.post(`/api/ws/add-member/${roomId}`, formData)
    },
    onMutate: async (newMember) => {
      await queryClient.cancelQueries({ queryKey: ["members", roomId] })
      const previousData = queryClient.getQueryData(["members", roomId])
      queryClient.setQueryData(["members", roomId], (old: any) => {
        const existingMembers = old?.members || []
        return {
          ...old,
          members: [...existingMembers, { 
            id: Math.random().toString(),
            email: newMember.email, 
            name: "Adding...", 
            role: "member" 
          }]
        }
      })
      return { previousData }
    },
    onError: (err: any, newMember, context) => {
      queryClient.setQueryData(["members", roomId], context?.previousData)
      toast({ title: "Error", description: "Failed to add member", variant: "destructive" })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["members", roomId] })
    },
    onSuccess: (_, variables) => {
      toast({ title: "Success", description: `${variables.email} added.`, variant: "success" })
      reset()
      onOpenChange(false) // Added this
    },
  })

  // --- 3. Remove Member ---
  const removeMemberMutation = useMutation({
    mutationFn: async (email: string) => {
      return await API.delete(`/api/ws/remove-member/${roomId}`, {
        data: { email } 
      })
    },
    onMutate: async (emailToRemove) => {
      await queryClient.cancelQueries({ queryKey: ["members", roomId] })
      const previousData = queryClient.getQueryData(["members", roomId])
      queryClient.setQueryData(["members", roomId], (old: any) => {
        if (!old) return old
        return {
          ...old,
          members: old.members.filter((m: Member) => m.email !== emailToRemove)
        }
      })
      return { previousData }
    },
    onError: (err: any, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["members", roomId], context.previousData)
      }
      toast({ title: "Error", description: "Failed to remove member", variant: "destructive" })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["members", roomId] })
    },
    onSuccess: () => {
      toast({ title: "Removed", description: "Access revoked.", variant: "success" })
      onOpenChange(false) // Added this
    }
  })

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) reset(); }}>
      <DialogContent className="sm:max-w-[425px] flex flex-col gap-6">
        <DialogHeader>
          <DialogTitle>Manage Members</DialogTitle>
          <DialogDescription>
            Access control for <span className="font-semibold text-foreground">"{roomTitle}"</span>.
          </DialogDescription>
        </DialogHeader>

        {/* Invite Form */}
        <form onSubmit={handleSubmit((d) => addMemberMutation.mutate(d))} className="space-y-3">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Invite by Email</Label>
          <div className="flex gap-2">
            <Input 
              {...register("email")} 
              placeholder="user@example.com" 
              className={errors.email ? "border-red-500" : "bg-[#FAFAFA]"}
            />
            <Button type="submit" disabled={addMemberMutation.isPending} size="sm">
              {addMemberMutation.isPending ? <Loader className="animate-spin h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            </Button>
          </div>
          {errors.email && <p className="text-red-500 text-[11px]">{errors.email.message}</p>}
        </form>

        <hr className="border-border" />

        {/* Members List */}
        <div className="space-y-3">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Added Members</Label>
          <ScrollArea className="h-[250px] -mr-4 pr-4">
            <div className="flex flex-col gap-4">
              {isLoadingMembers && !data ? (
                <div className="flex justify-center py-10">
                    <Loader className="animate-spin h-6 w-6 opacity-20" />
                </div>
                ) : 
                isLoadingMembers && membersList.length === 0 ? (
                <div className="flex justify-center py-10"><Loader className="animate-spin h-6 w-6 opacity-20" /></div>
              ) : membersList.length === 0 ? (
                <div className="text-center py-10 text-xs text-muted-foreground">No members yet.</div>
              ) : (
                membersList.map((member) => (
                  <div key={member.id} className="flex items-center justify-between group animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-border">
                        <AvatarImage src={member.profile_picture} />
                        <AvatarFallback className="text-[10px] font-bold bg-slate-100">
                          {member.name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <p className="text-sm font-semibold truncate leading-none mb-1">{member.name || "Pending User"}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      // Use email here instead of id
                      disabled={removeMemberMutation.isPending}
                      className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                      onClick={() => {
                        if(window.confirm(`Remove ${member.email}?`)) {
                          removeMemberMutation.mutate(member.email)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}