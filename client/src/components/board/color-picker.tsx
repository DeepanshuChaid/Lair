// @/components/toolbar/color-picker.tsx
"use client";

import { ColorToCss, cssToColor } from "@/lib/utils";
import { color } from "@/types/canvas";
import { CustomColorPicker } from "../ui/custom-color-picker";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";

interface ColorPickerProps {
    onChange: (color: color) => void;
    lastUsedColor: color;
}

export const ColorPicker = ({ onChange, lastUsedColor }: ColorPickerProps) => {
    const currentColorCss = ColorToCss(lastUsedColor) || "#000000";

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="w-9 h-9 p-0 border-neutral-200"
                >
                    <div 
                        className="w-6 h-6 rounded-sm border border-neutral-300" 
                        style={{ backgroundColor: currentColorCss }} 
                    />
                </Button>
            </PopoverTrigger>
            <PopoverContent side="right" align="start" className="p-3 w-auto flex flex-col gap-3">
                <div className="grid grid-cols-4 gap-2 border-b border-neutral-100 pb-3">
                    <ColorButton color={{ r: 243, g: 82, b: 35 }} onClick={onChange} />
                    <ColorButton color={{ r: 255, g: 249, b: 177 }} onClick={onChange} />
                    <ColorButton color={{ r: 68, g: 202, b: 99 }} onClick={onChange} />
                    <ColorButton color={{ r: 39, g: 142, b: 237 }} onClick={onChange} />
                    <ColorButton color={{ r: 155, g: 105, b: 245 }} onClick={onChange} />
                    <ColorButton color={{ r: 252, g: 142, b: 42 }} onClick={onChange} />
                    <ColorButton color={{ r: 0, g: 0, b: 0 }} onClick={onChange} />
                    <ColorButton color={{ r: 255, g: 255, b: 255 }} onClick={onChange} />
                </div>

                <CustomColorPicker
                    lastUsedColor={lastUsedColor}
                    value={currentColorCss}
                    onChange={(cssString) => {
                        // Ensure we only call onChange if we have a valid string
                        if (cssString) {
                            onChange(cssToColor(cssString));
                        }
                    }}
                />
            </PopoverContent>
        </Popover>
    );
};

const ColorButton = ({ color, onClick }: { color: color; onClick: (c: color) => void }) => (
    <button
        className="w-7 h-7 rounded-md border border-neutral-200 hover:scale-110 transition active:scale-95"
        style={{ backgroundColor: ColorToCss(color) }}
        onClick={() => onClick(color)}
    />
);