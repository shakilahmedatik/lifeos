import type { WeeklySummary } from "@lifeos/contracts";

interface WeeklyReviewWidgetProps {
  summary: WeeklySummary | null;
  loading?: boolean;
}

export default function WeeklyReviewWidget({ summary, loading }: WeeklyReviewWidgetProps) {
  if (loading) {
    return (
      <div className="p-4 bg-surface rounded-xl border border-border">
        <div className="text-center text-muted text-sm">Loading weekly summary...</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-4 bg-surface rounded-xl border border-border">
        <div className="text-center text-muted text-sm">No review data available</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-surface rounded-xl border border-border space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm text-primary">Weekly Review</h3>
        <span className="text-xs text-emerald-400 font-medium">
          {Math.round(summary.overallCompletionRate * 100)}% complete
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {summary.dailyBreakdown.map((day) => (
          <div key={day.date} className="text-center">
            <div className="text-[10px] text-muted mb-1">
              {new Date(`${day.date}T00:00:00`).toLocaleDateString("en-US", {
                weekday: "short",
              })}
            </div>
            <div
              className={`h-7 rounded-lg transition-colors ${
                day.completions > 0
                  ? "bg-emerald-500/30 border border-emerald-500/40"
                  : "bg-card border border-border"
              }`}
            />
          </div>
        ))}
      </div>

      {summary.topHabits.length > 0 && (
        <div className="pt-2 border-t border-border/60 space-y-1.5">
          <div className="text-xs font-medium text-secondary">Top Habits</div>
          {summary.topHabits.map((habit) => (
            <div key={habit.habitId} className="flex items-center justify-between text-xs">
              <span className="text-primary truncate">{habit.name}</span>
              <span className="text-emerald-400 font-medium">
                {Math.round(habit.completionRate * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
