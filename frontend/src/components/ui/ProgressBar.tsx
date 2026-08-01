import { cn } from "../../lib/utils.js";

interface ProgressBarProps {
  value: number; // 0-100
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
  barClassName?: string;
}

const sizeStyles = {
  sm: "h-1",
  md: "h-1.5",
  lg: "h-2.5",
};

export function ProgressBar({
  value,
  size = "md",
  showLabel = false,
  className,
  barClassName,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("flex-1 bg-border/50 rounded-full overflow-hidden", sizeStyles[size])}>
        <div
          className={cn(
            "h-full rounded-full bg-linear-to-r from-amber-500 to-amber-400 transition-[width] duration-300 ease-out",
            barClassName,
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-secondary tabular-nums min-w-10 text-right">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}

export default ProgressBar;
