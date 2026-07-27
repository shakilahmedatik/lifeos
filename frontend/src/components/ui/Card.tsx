import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  accent?: string;
  padding?: "sm" | "md" | "lg";
  hover?: boolean;
  onClick?: () => void;
}

const paddingStyles = {
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export default function Card({
  children,
  className = "",
  accent,
  padding = "md",
  hover = false,
  onClick,
}: CardProps) {
  return (
    <div
      className={`bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl ${paddingStyles[padding]} ${hover ? "hover:bg-gray-800/80 transition-colors duration-200" : ""} ${accent ? `border-l-4 ${accent}` : ""} ${onClick ? "cursor-pointer" : ""} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`flex items-center justify-between mb-3 ${className}`}>{children}</div>;
}

export function CardTitle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <h3 className={`text-sm font-semibold text-gray-200 ${className}`}>{children}</h3>;
}
