import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import API from "@/lib/axios";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader } from "lucide-react";

interface UploadProfilePictureDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const UploadProfilePicture = ({open, onOpenChange}: UploadProfilePictureDialogProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false)

    const queryClient = useQueryClient();

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;
        
        setIsUploading(true);
        const formData = new FormData();
        formData.append("profile_picture", file);
        mutate(formData);
    }

    const { mutate, isPending } = useMutation({
        mutationFn: async (formData: FormData) => {
            const response = await API.post("/api/add/profile-picture", formData);
            return response.data
        },
        onSuccess: () => {
            toast({ title: "Success", description: "Profile picture uploaded successfully", variant: "success" });
            onOpenChange(false);
            setFile(null);
            queryClient.invalidateQueries({ queryKey: ["user"] });
        },
        onError: (error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
            setIsUploading(false);
            setFile(null);
        }
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload Profile Picture</DialogTitle>
                    <DialogDescription>
                        Upload a new profile picture for your account.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleUpload} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="picture">Profile Image</Label>
                        <Input
                        id="picture"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="cursor-pointer"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                        variant="outline"
                        type="button"
                        onClick={() => onOpenChange(false)}
                        disabled={isUploading}
                        >
                        Cancel
                        </Button>
                        <Button type="submit" disabled={!file || isUploading}>
                        {isUploading ? <Loader className="animate-spin" size={18} /> : "Upload"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}