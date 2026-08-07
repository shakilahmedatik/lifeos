import type { ReactNode } from "react";
import { cn } from "../../lib/utils.js";

interface ListSkeletonProps {
  count?: number;
  height?: string;
  gap?: string;
  className?: string;
}

export default function ListSkeleton({
  count = 3,
  height = "h-16",
  gap = "gap-4",
  className,
}: ListSkeletonProps) {
  return (
    <div className={cn("flex flex-col w-full", gap, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn("w-full bg-card-hover rounded-xl animate-pulse", height)} />
      ))}
    </div>
  );
}
