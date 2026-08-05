import React from "react";
import Card, { CardContent, CardHeader, CardTitle } from "../../../components/ui/Card.js";
import { DonutChart } from "../../../components/ui/charts/DonutChart.js";
import { SimpleBarChart } from "../../../components/ui/charts/SimpleBarChart.js";
import { Select } from "../../../components/ui/Select.js";
import { useHabitAnalytics } from "../hooks/useHabitAnalytics.js";

export function HabitAnalytics({ habitId }: { habitId: string }) {
  const [period, setPeriod] = React.useState<"week" | "month">("week");
  const { data, loading } = useHabitAnalytics(habitId, period);

  if (loading || !data) return <div className="h-48 animate-pulse bg-card rounded-xl"></div>;

  const barData = data.dailyValues.map((d) => ({
    label: d.date.slice(-5), // MM-DD
    value: d.value,
  }));

  const donutData = [
    { label: "Completed", value: data.completionRate, color: "#10b981" },
    { label: "Missed", value: 100 - data.completionRate, color: "#374151" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-200">Analytics</h3>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Streak</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between">
            <div>
              <div className="text-2xl font-bold text-orange-400">{data.currentStreak}</div>
              <div className="text-xs text-gray-500">Current</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-200">{data.longestStreak}</div>
              <div className="text-xs text-gray-500">Best</div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 flex items-center justify-around py-4">
          <div className="w-24 h-24">
            <DonutChart data={donutData} />
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-200">
              {Math.round(data.completionRate)}%
            </div>
            <div className="text-sm text-gray-500">Completion Rate</div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Progress</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <SimpleBarChart data={barData} />
        </CardContent>
      </Card>
    </div>
  );
}
