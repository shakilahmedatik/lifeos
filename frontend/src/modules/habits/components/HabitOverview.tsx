import type { HabitDefinition } from "@lifeos/contracts";
import { Activity, Flame, TrendingUp, Trophy } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import Card, { CardContent, CardHeader, CardTitle } from "../../../components/ui/Card.js";
import { DonutChart } from "../../../components/ui/charts/DonutChart.js";
import { SimpleBarChart } from "../../../components/ui/charts/SimpleBarChart.js";
import { Select } from "../../../components/ui/Select.js";
import { useHabitAnalytics } from "../hooks/useHabitAnalytics.js";
import { useHabitWeeklyReview } from "../hooks/useHabitWeeklyReview.js";

interface HabitOverviewProps {
  habits: HabitDefinition[];
  loading: boolean;
  onNavigateBuilder: () => void;
}

export function HabitOverview({ habits, loading, onNavigateBuilder }: HabitOverviewProps) {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [selectedHabitId, setSelectedHabitId] = useState<string>("");

  const activeHabits = habits.filter((h) => !h.archived);

  useEffect(() => {
    if (activeHabits.length > 0 && !selectedHabitId) {
      setSelectedHabitId(activeHabits[0].id);
    }
  }, [activeHabits, selectedHabitId]);

  const { weeklySummary } = useHabitWeeklyReview();

  const { data: analyticsData, loading: analyticsLoading } = useHabitAnalytics(
    selectedHabitId || (activeHabits[0]?.id ?? ""),
    period,
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-card rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-card rounded-xl animate-pulse" />
      </div>
    );
  }

  if (activeHabits.length === 0) {
    return (
      <div className="p-12 text-center bg-surface rounded-2xl border border-border space-y-4">
        <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
          <Activity size={24} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-primary">No Habits Configured</h3>
          <p className="text-xs text-secondary mt-1">
            Configure habits in the Builder to see analytics and trends.
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateBuilder}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-lg transition-colors inline-flex items-center gap-2"
        >
          Go to Builder
        </button>
      </div>
    );
  }

  const selectedHabit = activeHabits.find((h) => h.id === selectedHabitId) || activeHabits[0];
  const habitColor = selectedHabit?.color || "var(--color-accent)";

  const overallRate = weeklySummary ? Math.round(weeklySummary.overallCompletionRate * 100) : 0;
  const topHabit = weeklySummary?.topHabits?.[0];

  const donutData = analyticsData
    ? [
        { label: "Completed", value: analyticsData.completionRate, color: habitColor },
        {
          label: "Remaining",
          value: Math.max(0, 100 - analyticsData.completionRate),
          color: "var(--color-border)",
        },
      ]
    : [];

  const barData = analyticsData
    ? analyticsData.dailyValues.map((d) => {
        let label = d.date.slice(-5);
        if (period === "week") {
          const [y, m, day] = d.date.split("-").map(Number);
          label = new Date(Date.UTC(y, m - 1, day)).toLocaleDateString("en-US", {
            weekday: "short",
            timeZone: "UTC",
          });
        }
        return {
          label,
          value: d.value,
          color: d.value >= (d.target || 1) ? habitColor : `${habitColor}99`,
        };
      })
    : [];

  const habitOptions = activeHabits.map((h) => ({
    value: h.id,
    label: `${h.icon || "📌"} ${h.name}`,
  }));

  const unitLabel =
    selectedHabit?.type === "water"
      ? "ml"
      : selectedHabit?.type === "walking"
        ? "steps"
        : selectedHabit?.type === "timed"
          ? "min"
          : selectedHabit?.type === "prayer"
            ? "prayers"
            : "logs";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top High-level Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="bg-linear-to-br from-emerald-900/20 to-emerald-950/30 border-emerald-800/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">
                Weekly Completion
              </p>
              <p className="text-2xl font-bold text-primary mt-1">{overallRate}%</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp size={18} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-blue-900/20 to-blue-950/30 border-blue-800/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-blue-400 uppercase tracking-wider">
                Active Habits
              </p>
              <p className="text-2xl font-bold text-primary mt-1">{activeHabits.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <Activity size={18} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-orange-900/20 to-orange-950/30 border-orange-800/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-orange-400 uppercase tracking-wider">
                Current Streak
              </p>
              <p className="text-2xl font-bold text-primary mt-1">
                {analyticsData?.currentStreak ?? 0} days
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400">
              <Flame size={18} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-purple-900/20 to-purple-950/30 border-purple-800/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-purple-400 uppercase tracking-wider">
                Top Habit
              </p>
              <p className="text-sm sm:text-base font-semibold text-primary mt-1 truncate max-w-[120px]">
                {topHabit?.name || "N/A"}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <Trophy size={18} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 7-Day Weekly Breakdown Heatmap */}
      {weeklySummary && weeklySummary.dailyBreakdown.length > 0 && (
        <Card className="bg-surface border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary flex items-center justify-between">
              <span>7-Day Consistency Heatmap</span>
              <span className="text-xs text-muted font-normal">Past 7 days</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {weeklySummary.dailyBreakdown.map((day) => {
                const [y, m, d] = day.date.split("-").map(Number);
                const dateObj = new Date(Date.UTC(y, m - 1, d));
                const dayName = dateObj.toLocaleDateString("en-US", {
                  weekday: "short",
                  timeZone: "UTC",
                });
                return (
                  <div key={day.date} className="text-center space-y-1.5">
                    <span className="text-[11px] text-muted font-medium">{dayName}</span>
                    <div
                      className={`h-11 rounded-xl flex flex-col items-center justify-center font-bold text-xs transition-all ${
                        day.completions > 0
                          ? "bg-emerald-500/20 border border-emerald-500/40 text-success shadow-xs shadow-emerald-500/15"
                          : "bg-surface-elevated border border-border/60 text-muted"
                      }`}
                    >
                      <span>{day.completions > 0 ? `${day.completions} ✓` : "0"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Per-Habit Analytics View */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-surface p-4 rounded-xl border border-border">
          <div>
            <h3 className="font-semibold text-primary text-sm sm:text-base">
              Habit Analytics & Performance
            </h3>
            <p className="text-xs text-secondary">
              Select a habit to view completion trends and daily intake logs.
            </p>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {habitOptions.length > 0 && (
              <div className="flex-1 sm:w-52">
                <Select
                  value={selectedHabitId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setSelectedHabitId(e.target.value)
                  }
                  options={habitOptions}
                />
              </div>
            )}
            <div className="w-32">
              <Select
                value={period}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setPeriod(e.target.value as "week" | "month")
                }
                options={[
                  { value: "week", label: "This Week" },
                  { value: "month", label: "This Month" },
                ]}
              />
            </div>
          </div>
        </div>

        {analyticsLoading ? (
          <div className="h-64 bg-card rounded-xl animate-pulse" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Donut Chart & Streak Card */}
            <Card className="flex flex-col justify-between p-6">
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-36 h-36 relative flex items-center justify-center">
                  <DonutChart data={donutData} size={144} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold font-mono text-primary">
                      {analyticsData?.completionRate ?? 0}%
                    </span>
                    <span className="text-[10px] text-muted">rate</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-secondary">
                    {period === "week" ? "7-Day Completion" : "30-Day Completion"}
                  </p>
                </div>
              </div>

              {/* Stats Breakdown Bar */}
              <div className="grid grid-cols-3 gap-2 pt-4 mt-2 border-t border-border text-center">
                <div>
                  <div className="text-base font-bold text-orange-400 font-mono">
                    {analyticsData?.currentStreak ?? 0}d
                  </div>
                  <div className="text-[10.5px] text-muted">Current</div>
                </div>
                <div>
                  <div className="text-base font-bold text-primary font-mono">
                    {analyticsData?.longestStreak ?? 0}d
                  </div>
                  <div className="text-[10.5px] text-muted">Best</div>
                </div>
                <div>
                  <div className="text-base font-bold text-emerald-400 font-mono">
                    {analyticsData?.averageValue ?? 0}
                  </div>
                  <div className="text-[10.5px] text-muted">Avg / Day</div>
                </div>
              </div>
            </Card>

            {/* Daily Values Bar Chart Card */}
            <Card className="lg:col-span-2 flex flex-col">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: habitColor }}
                  />
                  <span>Daily Progress ({selectedHabit?.name})</span>
                </CardTitle>
                <span className="text-xs text-muted font-mono">
                  Total: {analyticsData?.totalValue?.toLocaleString() ?? 0} {unitLabel}
                </span>
              </CardHeader>
              <CardContent className="p-4 flex-1 flex flex-col justify-end min-h-[220px]">
                <SimpleBarChart
                  data={barData}
                  height={190}
                  showYAxis={true}
                  formatValue={(v) => `${v.toLocaleString()} ${unitLabel}`}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
