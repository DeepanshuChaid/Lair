"use client";

import { LucideIcon } from "lucide-react";

import Hint from "@/components/dashboard/sidebar/hint";
import { Button } from "@/components/ui/button";

interface ToolButtonProps {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
    isDisabled?: boolean;
    isActive?: boolean;
}



export const ToolButton = ({
    label,
    icon: Icon, // Rename 'icon' to 'Icon' here so you can use it as a component
    onClick,
    isDisabled,
    isActive,
}: ToolButtonProps) => {
    return (
        <Hint label={label} side="right" sideOffset={14} align="start">
            <Button
                disabled={isDisabled}
                onClick={onClick}
                variant={isActive ? "boardActive" : "board"}
                size="icon"
            >
                <Icon className="h-4 w-4" /> {/* Now Icon works, and added standard sizing */}
            </Button>
        </Hint>
    )
}