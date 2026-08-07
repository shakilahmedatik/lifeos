import type { ReactNode } from "react";
import { cn } from "../../lib/utils.js";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "blue"
  | "purple"
  | "orange"
  | "pink";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
  onClick?: () => void;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-card-solid text-secondary",
  success: "bg-success/15 text-success border border-success/30",
  warning: "bg-warning/15 text-warning border border-warning/30",
  danger: "bg-danger/15 text-danger border border-danger/30",
  info: "bg-accent-muted text-accent border border-accent/30",
  blue: "bg-blue-500/15 text-blue-500",
  purple: "bg-purple-500/15 text-purple-500",
  orange: "bg-orange-500/15 text-orange-500",
  pink: "bg-pink-500/15 text-pink-500",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
};

export default function Badge({
  children,
  variant = "default",
  size = "sm",
  className = "",
  onClick,
}: BadgeProps) {
  const combinedClassName = cn(
    "inline-flex items-center font-medium rounded-full",
    variantStyles[variant],
    sizeStyles[size],
    onClick && "cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent",
    className
  );

  if (onClick) {
    return (
      <button type="button" className={combinedClassName} onClick={onClick}>
        {children}
      </button>
    );
  }

  return <span className={combinedClassName}>{children}</span>;
}
