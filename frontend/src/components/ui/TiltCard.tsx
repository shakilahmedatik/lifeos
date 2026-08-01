import { type ReactNode, useRef } from "react";
import { cn } from "../../lib/utils.js";

export interface TiltCardProps {
  children: ReactNode;
  max?: number;
  glare?: boolean;
  className?: string;
  onClick?: () => void;
}

export function TiltCard({ children, className, onClick }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} onClick={onClick} className={cn("relative overflow-hidden", className)}>
      {children}
    </div>
  );
}
