import type { DashboardHabitConsistency } from "@lifeos/contracts";
import { Flame } from "lucide-react";
import { Sparkline } from "../../../components/ui/charts/Sparkline.js";
import { EmptyState } from "../../../components/ui/EmptyState.js";
import { DashboardPanel } from "../components/DashboardPanel.js";

interface HabitConsistencyWidgetProps {
  habits: DashboardHabitConsistency[];
}

function RadialProgress({ pct, size = 38 }: { pct: number; size?: number }) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, pct)) / 100);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
          fill="none"
          opacity={0.4}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-accent)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-[10px] text-accent font-semibold">{pct}%</span>
      </div>
    </div>
  );
}

const WEEK_DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function HabitWeekPills({ days, color }: { days: number[]; color: string }) {
  // Ensure we have 7 days
  const filledDays = [...days];
  while (filledDays.length < 7) filledDays.unshift(0);
  const sevenDays = filledDays.slice(-7);

  return (
    <div className="flex items-center gap-1 shrink-0" title={`7-day: ${sevenDays.join("%, ")}%`}>
      {sevenDays.map((val, idx) => {
        const isDone = val >= 100;
        const isPartial = val > 0 && val < 100;
        return (
          <div
            key={`pill-${idx}`}
            className="group/pill relative flex flex-col items-center justify-end"
          >
            <div className="w-1.5 h-4.5 rounded-full bg-surface-elevated overflow-hidden border border-border/40 transition-all group-hover/pill:scale-110">
              <div
                className="w-full rounded-full transition-all duration-300"
                style={{
                  height: `${Math.max(val > 0 ? 25 : 0, Math.min(100, val))}%`,
                  backgroundColor: color,
                  opacity: isDone ? 1 : isPartial ? 0.7 : 0.15,
                  marginTop: "auto",
                }}
              />
            </div>
            {/* Tooltip on pill hover */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover/pill:flex items-center px-1.5 py-0.5 rounded bg-card text-[9px] font-mono text-primary shadow border border-border pointer-events-none z-20 whitespace-nowrap">
              {WEEK_DAY_LABELS[idx]}: {val}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function HabitConsistencyWidget({ habits }: HabitConsistencyWidgetProps) {
  const overallAvg =
    habits.length > 0
      ? Math.round(habits.reduce((sum, h) => sum + h.weekAverage, 0) / habits.length)
      : 0;

  return (
    <DashboardPanel
      title="Consistency"
      subtitle="7 days"
      action={<RadialProgress pct={overallAvg} />}
    >
      <div className="flex flex-col gap-2.5 justify-center h-full overflow-hidden">
        {habits.length === 0 ? (
          <EmptyState title="No habit data" className="py-4" />
        ) : (
          habits.slice(0, 4).map((row) => (
            <div
              key={row.habitId}
              className="flex items-center justify-between gap-2 text-xs p-1.5 rounded-lg hover:bg-surface-elevated/40 transition-colors"
            >
              {/* Habit Name and Color */}
              <div className="flex items-center gap-1.5 w-24 sm:w-28 shrink-0 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: row.color }}
                />
                <span className="text-primary truncate text-[11.5px] font-medium" title={row.name}>
                  {row.name}
                </span>
              </div>

              {/* Sparkline Curve */}
              <div className="hidden sm:block h-5 flex-1 min-w-[50px] max-w-[90px] px-1">
                <Sparkline data={row.days} color={row.color} className="w-full h-full" />
              </div>

              {/* 7-Day Micro Pill Tracks */}
              <HabitWeekPills days={row.days} color={row.color} />

              {/* Streak and Week Average Badge */}
              <div className="flex items-center gap-1.5 w-14 justify-end shrink-0 font-mono text-[10.5px]">
                {row.currentStreak > 0 && (
                  <span
                    className="flex items-center gap-0.5 text-orange-400 font-semibold"
                    title={`Current streak: ${row.currentStreak} days`}
                  >
                    <Flame size={11} className="fill-orange-400/20" />
                    {row.currentStreak}
                  </span>
                )}
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    row.weekAverage >= 70
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                      : row.weekAverage > 0
                        ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                        : "text-muted"
                  }`}
                >
                  {row.weekAverage}%
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardPanel>
  );
}
