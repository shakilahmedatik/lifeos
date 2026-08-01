import type { ElementType } from "react";
import { cn } from "../../lib/utils.js";
import { TiltCard } from "./TiltCard.js";

interface StatCardProps {
  value: number;
  label: string;
  icon?: ElementType;
  format?: (n: number) => string;
  trend?: { value: number; label: string };
  className?: string;
  valueClassName?: string;
  iconClassName?: string;
}

export function StatCard({
  value,
  label,
  icon: Icon,
  format = (n) => n.toLocaleString(),
  trend,
  className,
  valueClassName,
  iconClassName,
}: StatCardProps) {
  return (
    <TiltCard
      className={cn(
        "p-3 rounded-xl glass hover:shadow-lg hover:border-accent/30 transition-all duration-300 ease-out cursor-default",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p
            className={cn(
              "text-xl font-bold text-primary tabular-nums tracking-tight",
              valueClassName,
            )}
          >
            {format(Math.round(value))}
          </p>
          <p className="text-[11px] text-muted mt-0.5 uppercase tracking-wider">{label}</p>
        </div>
        {Icon && (
          <div
            className={cn(
              "w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center",
              iconClassName,
            )}
          >
            <Icon className="w-4 h-4 text-accent" />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-2 flex items-center gap-1">
          <span
            className={cn(
              "text-[11px] font-medium",
              trend.value >= 0 ? "text-success" : "text-danger",
            )}
          >
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
          <span className="text-[11px] text-muted">{trend.label}</span>
        </div>
      )}
    </TiltCard>
  );
}

export default StatCard;
