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

interface ManageMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roomId: string
  roomTitle: string
}

export const ManageMembers = ({ open, onOpenChange, roomId, roomTitle }: ManageMembersDialogProps) => {
  const queryClient = useQueryClient()

  // --- 1. Fetch Members Logic ---
  const { data: members, isLoading: isLoadingMembers } = useQuery<any>({
    queryKey: ["members", roomId],
    queryFn: async () => {
      const res = await API.get(`/api/room/get-members/${roomId}`)
      return res.data
    },
    enabled: open, // Only fetch when the dialog is actually open
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "" },
  })

  // --- 2. Add Member Mutation ---
  const addMemberMutation = useMutation({
    mutationFn: async (data: InviteFormValues) => {
      return await API.post(`/api/ws/add-member/${roomId}`, data)
    },
    onSuccess: (_, variables) => {
      toast({ title: "Invited!", description: `${variables.email} added.`, variant: "success" })
      queryClient.invalidateQueries({ queryKey: ["members", roomId] })
      reset()
    },
    onError: (err: any) => {
      toast({ 
        title: "Error", 
        description: err?.response?.data?.message || "Failed to add member", 
        variant: "destructive" 
      })
    }
  })

  // --- 3. Remove Member Mutation ---
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await API.delete(`/api/ws/remove-member/${roomId}/${memberId}`)
    },
    onSuccess: () => {
      toast({ title: "Removed", description: "Member removed." })
      queryClient.invalidateQueries({ queryKey: ["members", roomId] })
    },
    onError: (err: any) => {
      toast({ 
        title: "Error", 
        description: err?.response?.data?.message || "Could not remove member", 
        variant: "destructive" 
      })
    }
  })

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) reset(); }}>
      <DialogContent className="sm:max-w-[425px] flex flex-col gap-6">
        <DialogHeader>
          <DialogTitle>Manage Members</DialogTitle>
          <DialogDescription>
            Manage access for <span className="font-semibold text-foreground">"{roomTitle}"</span>.
          </DialogDescription>
        </DialogHeader>

        {/* Invite Form */}
        <form onSubmit={handleSubmit((data) => addMemberMutation.mutate(data))} className="space-y-3">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Invite Member</Label>
          <div className="flex gap-2">
            <Input 
              {...register("email")} 
              placeholder="email@example.com" 
              className={errors.email ? "border-red-500" : ""}
            />
            <Button type="submit" disabled={addMemberMutation.isPending} size="sm" className="shrink-0">
              {addMemberMutation.isPending ? <Loader className="animate-spin h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            </Button>
          </div>
          {errors.email && <p className="text-red-500 text-[11px] font-medium">{errors.email.message}</p>}
        </form>

        <hr className="border-border" />

        {/* Members List */}
        <div className="space-y-3">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Current Access</Label>
          <ScrollArea className="h-[220px] -mr-4 pr-4">
            <div className="flex flex-col gap-4">
              {isLoadingMembers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="animate-spin h-6 w-6 text-muted-foreground" />
                </div>
              ) : members?.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-8">No members found.</p>
              ) : (
                members?.members.map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-border">
                        <AvatarImage src={member.profile_picture} />
                        <AvatarFallback className="text-[10px] font-bold bg-muted uppercase">
                          {member.name?.charAt(0) || member.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <p className="text-sm font-semibold truncate">{member.name || "User"}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={removeMemberMutation.isPending}
                      className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                      onClick={() => {
                        if(confirm(`Remove ${member.email}?`)) {
                          removeMemberMutation.mutate(member.id)
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
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}