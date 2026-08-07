import { Check } from "lucide-react";
import type { CSSProperties } from "react";
import { cn } from "../../lib/utils.js";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  colors?: string[];
  className?: string;
}

const DEFAULT_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#d946ef",
  "#f43f5e",
];

export function ColorPicker({
  value,
  onChange,
  colors = DEFAULT_COLORS,
  className,
}: ColorPickerProps) {
  return (
    <div className={cn("grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-12", className)}>
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface",
            value === color ? "ring-2 ring-offset-2 ring-offset-surface" : "",
          )}
          style={{ backgroundColor: color, "--tw-ring-color": color } as CSSProperties}
        >
          {value === color && <Check size={16} className="text-white drop-shadow-md" />}
        </button>
      ))}
    </div>
  );
}
