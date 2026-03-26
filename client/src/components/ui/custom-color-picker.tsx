"use client";

import React, { forwardRef, useMemo, useState, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import Image from "next/image";

import { cn, ColorToCss } from "../../lib/utils";
import { useForwardedRef } from "../../hooks/use-forward-ref";
import { Button, type ButtonProps } from "./button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./popover";
import { Input } from "./input";
import { type color } from "../../types/canvas";

interface ColorPickerProps {
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    lastUsedColor: color;
}

// We extend ButtonProps but omit the ones we are overriding manually
interface CustomPickerProps extends Omit<ButtonProps, "value" | "onChange" | "onBlur">, ColorPickerProps {}

const CustomColorPicker = forwardRef<HTMLInputElement, CustomPickerProps>(
    (
        { disabled, value, lastUsedColor, onChange, onBlur, name, className, ...props },
        forwardedRef
    ) => {
        const ref = useForwardedRef(forwardedRef);
        const [open, setOpen] = useState(false);

        const parsedValue = useMemo(() => {
            return value || ColorToCss(lastUsedColor);
        }, [value, lastUsedColor]);

        return (
            <div className="flex flex-col gap-y-2">
                <DebouncedPicker color={parsedValue} onChange={onChange} />
                <Input
                    className="h-8 font-mono text-xs"
                    maxLength={7}
                    onChange={(e) => onChange(e.currentTarget.value)}
                    value={parsedValue}
                />
            </div>
        );
    }
);

/**
 * Native Debounced Picker to replace use-debouncy and avoid 
 * React 19 dependency conflicts.
 */
const DebouncedPicker = ({ color, onChange }: { color: string; onChange: (val: string) => void }) => {
    const [value, setValue] = useState(color);

    // Sync internal state with prop changes
    useEffect(() => {
        setValue(color);
    }, [color]);

    // Debounce the outgoing onChange call
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (value !== color) {
                onChange(value);
            }
        }, 200);
        return () => clearTimeout(timeout);
    }, [value, onChange, color]);

    return <HexColorPicker color={value} onChange={setValue} />;
};

CustomColorPicker.displayName = "CustomColorPicker";

export { CustomColorPicker };

