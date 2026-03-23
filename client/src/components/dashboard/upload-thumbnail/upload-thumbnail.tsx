import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import API from "@/lib/axios";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader } from "lucide-react";

interface UploadThumbnailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    id: string;
}

export default function UploadThumbnail({open, onOpenChange, id}: UploadThumbnailDialogProps) {
    const [file, setFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)

    const queryClient = useQueryClient();

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;
        
        setIsUploading(true);
        const formData = new FormData();
        // Must match backend `c.FormFile("thumbnail")`
        formData.append("thumbnail", file);
        mutate(formData);
    }

    const { mutate, isPending } = useMutation({
        mutationFn: async (formData: FormData) => {
            const response = await API.post(`/api/room/uploadthumbnail/${id}`, formData);
            return response.data
        },
        onSuccess: () => {
            toast({ title: "Success", description: "Thumbnail uploaded successfully", variant: "success" });
            onOpenChange(false);
            setFile(null);
            setIsUploading(false);
            queryClient.invalidateQueries({ queryKey: ["rooms"] });
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
                    <DialogTitle>Upload Thumbnail</DialogTitle>
                    <DialogDescription>
                        Upload a new Thumbnail for your Room.
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