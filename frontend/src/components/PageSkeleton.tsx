import { cn } from "../lib/utils.js";

interface PageSkeletonProps {
  className?: string;
}

function PageSkeleton({ className }: PageSkeletonProps = {}) {
  return (
    <div className={cn("p-6 space-y-4 animate-pulse max-w-7xl mx-auto", className)}>
      <div className="h-8 bg-card-hover rounded-lg w-1/4" />
      <div className="h-64 bg-card rounded-xl border border-border" />
    </div>
  );
}

export default PageSkeleton;
