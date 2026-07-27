import type { WeeklySummary } from "@lifeos/contracts";

interface WeeklyReviewWidgetProps {
  summary: WeeklySummary | null;
  loading?: boolean;
}

export default function WeeklyReviewWidget({ summary, loading }: WeeklyReviewWidgetProps) {
  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <div className="text-center text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Weekly Review</h3>
        <span className="text-sm text-gray-500">
          {Math.round(summary.overallCompletionRate * 100)}% complete
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {summary.dailyBreakdown.map((day) => (
          <div key={day.date} className="text-center">
            <div className="text-xs text-gray-500">
              {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
            </div>
            <div
              className={`h-8 rounded ${day.completions > 0 ? "bg-green-500" : "bg-gray-100"}`}
            />
          </div>
        ))}
      </div>

      {summary.topHabits.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Top Habits</div>
          {summary.topHabits.map((habit) => (
            <div key={habit.habitId} className="flex items-center justify-between text-sm">
              <span>{habit.name}</span>
              <span className="text-green-600">{Math.round(habit.completionRate * 100)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
