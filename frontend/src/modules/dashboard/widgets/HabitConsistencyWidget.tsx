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
  const offset = circumference * (1 - pct / 100);

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
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-[10px] text-accent font-semibold">{pct}%</span>
      </div>
    </div>
  );
}

function HabitSparkline({ row }: { row: DashboardHabitConsistency }) {
  return (
    <div className="h-6 flex-1 min-w-0" title={`${row.days.join("%, ")}%`}>
      <Sparkline data={row.days} color={row.color} className="w-full h-full" />
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
      <div className="flex flex-col gap-2 justify-center h-full overflow-hidden">
        {habits.length === 0 ? (
          <EmptyState title="No habit data" className="py-4" />
        ) : (
          habits.slice(0, 4).map((row) => (
            <div key={row.habitId} className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 w-20 shrink-0">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: row.color }}
                />
                <span className="text-primary truncate text-[11.5px]">{row.name}</span>
              </div>

              <HabitSparkline row={row} />

              <div className="flex items-center gap-1 w-10 justify-end shrink-0 font-mono text-[10px]">
                {row.currentStreak >= 3 && (
                  <span className="flex items-center text-orange-400">
                    <Flame size={10} />
                    {row.currentStreak}
                  </span>
                )}
                <span className="text-muted">{row.weekAverage}%</span>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardPanel>
  );
}
