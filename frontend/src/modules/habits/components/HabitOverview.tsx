import type { HabitDefinition, WeeklySummary } from "@lifeos/contracts";
import { Activity, Flame, TrendingUp, Trophy } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import Card, { CardContent, CardHeader, CardTitle } from "../../../components/ui/Card.js";
import { DonutChart } from "../../../components/ui/charts/DonutChart.js";
import { SimpleBarChart } from "../../../components/ui/charts/SimpleBarChart.js";
import { Select } from "../../../components/ui/Select.js";
import { habitApi } from "../api.js";
import { useHabitAnalytics } from "../hooks/useHabitAnalytics.js";

interface HabitOverviewProps {
  habits: HabitDefinition[];
  loading: boolean;
  onNavigateBuilder: () => void;
}

export function HabitOverview({ habits, loading, onNavigateBuilder }: HabitOverviewProps) {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [selectedHabitId, setSelectedHabitId] = useState<string>("");
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);

  const activeHabits = habits.filter((h) => !h.archived);

  useEffect(() => {
    if (activeHabits.length > 0 && !selectedHabitId) {
      setSelectedHabitId(activeHabits[0].id);
    }
  }, [activeHabits, selectedHabitId]);

  useEffect(() => {
    habitApi.getWeeklySummary().then(setWeeklySummary).catch(console.error);
  }, []);

  const { data: analyticsData, loading: analyticsLoading } = useHabitAnalytics(
    selectedHabitId || (activeHabits[0]?.id ?? ""),
    period,
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          onClick={onNavigateBuilder}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-lg transition-colors inline-flex items-center gap-2"
        >
          Go to Builder
        </button>
      </div>
    );
  }

  const selectedHabit = activeHabits.find((h) => h.id === selectedHabitId) || activeHabits[0];

  const overallRate = weeklySummary ? Math.round(weeklySummary.overallCompletionRate * 100) : 0;
  const topHabit = weeklySummary?.topHabits?.[0];

  const donutData = analyticsData
    ? [
        { label: "Completed", value: analyticsData.completionRate, color: "var(--color-success)" },
        {
          label: "Missed",
          value: Math.max(0, 100 - analyticsData.completionRate),
          color: "var(--color-border)",
        },
      ]
    : [];

  const barData = analyticsData
    ? analyticsData.dailyValues.map((d) => ({
        label: d.date.slice(-5), // MM-DD
        value: d.value,
      }))
    : [];

  const habitOptions = activeHabits.map((h) => ({
    value: h.id,
    label: `${h.icon || "📌"} ${h.name}`,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top High-level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-linear-to-br from-emerald-900/20 to-emerald-950/30 border-emerald-800/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                Weekly Completion
              </p>
              <p className="text-2xl font-bold text-primary mt-1">{overallRate}%</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-blue-900/20 to-blue-950/30 border-blue-800/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-400 uppercase tracking-wider">
                Active Habits
              </p>
              <p className="text-2xl font-bold text-primary mt-1">{activeHabits.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
              <Activity size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-orange-900/20 to-orange-950/30 border-orange-800/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-orange-400 uppercase tracking-wider">
                Current Streak
              </p>
              <p className="text-2xl font-bold text-primary mt-1">
                {analyticsData?.currentStreak ?? 0} days
              </p>
            </div>
            <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400">
              <Flame size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-purple-900/20 to-purple-950/30 border-purple-800/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-purple-400 uppercase tracking-wider">
                Top Habit
              </p>
              <p className="text-base font-semibold text-primary mt-1 truncate max-w-30">
                {topHabit?.name || "N/A"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
              <Trophy size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 7-Day Weekly Breakdown Heatmap */}
      {weeklySummary && (
        <Card className="bg-surface border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary">
              7-Day Consistency Heatmap
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-2">
              {weeklySummary.dailyBreakdown.map((day) => {
                const dateObj = new Date(`${day.date}T00:00:00`);
                const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
                return (
                  <div key={day.date} className="text-center space-y-1.5">
                    <span className="text-[11px] text-muted font-medium">{dayName}</span>
                    <div
                      className={`h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                        day.completions > 0
                          ? "bg-emerald-500/20 border border-emerald-500/40 text-success shadow-sm shadow-emerald-500/20"
                          : "bg-surface-elevated border border-border text-muted"
                      }`}
                    >
                      {day.completions > 0 ? `${day.completions} ✓` : "0"}
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-4 rounded-xl border border-border">
          <div>
            <h3 className="font-semibold text-primary">Habit Analytics & Performance</h3>
            <p className="text-xs text-secondary">
              Select a habit to view completion rates and progress trends.
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            {habitOptions.length > 0 && (
              <div className="w-48">
                <Select
                  value={selectedHabitId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setSelectedHabitId(e.target.value)
                  }
                  options={habitOptions}
                />
              </div>
            )}
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

        {analyticsLoading ? (
          <div className="h-64 bg-card rounded-xl animate-pulse" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Donut Chart & Streak */}
            <Card className="flex flex-col justify-center items-center p-6 space-y-4">
              <div className="w-32 h-32 relative">
                <DonutChart data={donutData} />
              </div>
              <div className="text-center">
                <span className="text-3xl font-bold text-primary">
                  {analyticsData?.completionRate ?? 0}%
                </span>
                <p className="text-xs text-muted mt-0.5">Completion Rate ({period})</p>
              </div>
              <div className="flex gap-6 pt-2 border-t border-border w-full justify-center text-center">
                <div>
                  <div className="text-lg font-bold text-orange-400">
                    {analyticsData?.currentStreak ?? 0}
                  </div>
                  <div className="text-[11px] text-muted">Current Streak</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-primary">
                    {analyticsData?.longestStreak ?? 0}
                  </div>
                  <div className="text-[11px] text-muted">Best Streak</div>
                </div>
              </div>
            </Card>

            {/* Daily Values Bar Chart */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-primary">
                  Daily Intake & Logs ({selectedHabit?.name})
                </CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <SimpleBarChart data={barData} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
