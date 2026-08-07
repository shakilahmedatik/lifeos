import { User } from "lucide-react";
import { cn } from "../../lib/utils.js";

interface AvatarProps {
  src?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

export function Avatar({ src, fallback, size = "md", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden bg-surface-elevated border border-border shrink-0 flex items-center justify-center text-primary",
        sizeClasses[size],
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt="Avatar"
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : fallback ? (
        <span className="font-medium uppercase">{fallback.slice(0, 2)}</span>
      ) : (
        <User size={size === "sm" ? 14 : size === "xl" ? 24 : 18} className="text-muted" />
      )}
    </div>
  );
}
