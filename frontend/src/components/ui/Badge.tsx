import type { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "blue" | "purple" | "orange" | "pink";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-700 text-gray-300",
  success: "bg-green-900/60 text-green-300 border border-green-700/50",
  warning: "bg-yellow-900/60 text-yellow-300 border border-yellow-700/50",
  danger: "bg-red-900/60 text-red-300 border border-red-700/50",
  info: "bg-blue-900/60 text-blue-300 border border-blue-700/50",
  blue: "bg-blue-900/50 text-blue-300",
  purple: "bg-purple-900/50 text-purple-300",
  orange: "bg-orange-900/50 text-orange-300",
  pink: "bg-pink-900/50 text-pink-300",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
};

export default function Badge({ children, variant = "default", size = "sm", className = "" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  );
}
