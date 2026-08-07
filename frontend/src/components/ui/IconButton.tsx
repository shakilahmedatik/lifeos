import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils.js";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  variant?: "ghost" | "solid" | "outline";
  size?: "sm" | "md" | "lg";
}

export default function IconButton({
  icon,
  variant = "ghost",
  size = "md",
  className,
  ...props
}: IconButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-lg transition-colors";

  const variantStyles = {
    ghost: "text-muted hover:text-primary hover:bg-card-hover",
    solid: "bg-surface-elevated text-primary hover:bg-card-hover",
    outline: "border border-border text-primary hover:bg-card-hover",
  };

  const sizeStyles = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-3",
  };

  return (
    <button
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      {...props}
    >
      {icon}
    </button>
  );
}
