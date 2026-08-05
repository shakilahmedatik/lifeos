import type { DashboardSkillProgress } from "@lifeos/contracts";
import { DashboardPanel } from "../components/DashboardPanel.js";

interface SkillsProgressWidgetProps {
  skills: DashboardSkillProgress[];
}

const BAR_COLORS = ["bg-amber-400", "bg-indigo-400", "bg-emerald-400", "bg-rose-400"];

export function SkillsProgressWidget({ skills }: SkillsProgressWidgetProps) {
  return (
    <DashboardPanel title="Skills" subtitle="weekly target">
      <div className="flex flex-col gap-2.5 justify-center h-full overflow-hidden">
        {skills.length === 0 ? (
          <div className="text-center text-muted text-xs py-4">No skill areas tracked</div>
        ) : (
          skills.slice(0, 4).map((s, i) => (
            <div key={s.skillAreaId}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-200 truncate max-w-[150px]">{s.name}</span>
                <span className="font-mono text-[10px] text-muted">
                  {s.hoursThisWeek}h / {s.weeklyGoalHours}h
                </span>
              </div>
              <div className="h-1.5 bg-border/60 rounded-full overflow-hidden">
                <div
                  className={`h-full ${BAR_COLORS[i % BAR_COLORS.length]} rounded-full transition-all duration-500`}
                  style={{ width: `${s.pct}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardPanel>
  );
}
