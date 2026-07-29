import { animate, useInView, useReducedMotion } from "motion/react";
import { type ElementType, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils.js";
import { TiltCard } from "./TiltCard.js";

interface StatCardProps {
  value: number;
  label: string;
  icon?: ElementType;
  format?: (n: number) => string;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatCard({
  value,
  label,
  icon: Icon,
  format = (n) => n.toLocaleString(),
  trend,
  className,
}: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      fromRef.current = value;
      setDisplay(Math.round(value));
      return;
    }
    const controls = animate(fromRef.current, value, {
      duration: 1,
      ease: [0.23, 1, 0.32, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    fromRef.current = value;
    return () => controls.stop();
  }, [value, inView, reduce]);

  return (
    <TiltCard
      className={cn(
        "p-3 rounded-xl glass hover:shadow-lg hover:border-accent/30 transition-all duration-300 ease-out cursor-default",
        className,
      )}
    >
      <div ref={ref} className="flex items-center justify-between">
        <div>
          <p className="text-xl font-bold text-primary tabular-nums tracking-tight">
            {format(display)}
          </p>
          <p className="text-[11px] text-muted mt-0.5 uppercase tracking-wider">{label}</p>
        </div>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center">
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
