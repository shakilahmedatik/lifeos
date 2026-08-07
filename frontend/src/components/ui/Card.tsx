import type { ReactNode, KeyboardEvent } from "react";
import { TiltCard } from "./TiltCard.js";
import { cn } from "../../lib/utils.js";

interface CardProps {
  children: ReactNode;
  className?: string;
  accent?: string;
  padding?: "sm" | "md" | "lg" | "none";
  hover?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

const paddingStyles = {
  none: "",
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
  interactive = false,
  onClick,
}: CardProps) {
  const isInteractive = interactive || !!onClick || hover || className.includes("hover:");

  const interactiveProps = onClick
    ? {
        role: "button",
        tabIndex: 0,
        onKeyDown: (e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        },
      }
    : {};

  const content = (
    <div
      className={cn(
        "bg-card border border-border rounded-xl",
        paddingStyles[padding],
        hover && "hover:bg-card-hover transition-colors duration-200",
        accent && `border-l-4 ${accent}`,
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      {...interactiveProps}
    >
      {children}
    </div>
  );

  if (isInteractive) {
    return (
      <TiltCard className={className} onClick={onClick}>
        <div
          className={cn(
            "bg-card border border-border rounded-xl h-full w-full",
            paddingStyles[padding],
            hover && "hover:bg-card-hover transition-colors duration-200",
            accent && `border-l-4 ${accent}`
          )}
        >
          {children}
        </div>
      </TiltCard>
    );
  }

  return content;
}

export function CardHeader({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("flex items-center justify-between mb-3", className)}>{children}</div>;
}

export function CardTitle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <h3 className={cn("text-sm font-semibold text-primary", className)}>{children}</h3>;
}

export function CardContent({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
