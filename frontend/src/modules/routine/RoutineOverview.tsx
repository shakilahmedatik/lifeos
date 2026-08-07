import type { RoutineStats, TaskCategory } from "@lifeos/contracts";
import {
  Activity as ActivityIcon,
  Calendar as CalendarIcon,
  CheckCircle2 as CheckCircle2Icon,
  Clock as ClockIcon,
  Flame as FlameIcon,
  History as HistoryIcon,
  Plus as PlusIcon,
  Target as TargetIcon,
  TrendingUp as TrendingUpIcon,
} from "lucide-react";
import Card, { CardContent, CardHeader, CardTitle } from "../../components/ui/Card.js";
import TaskCategoryBadge, { CATEGORY_COLORS } from "./TaskCategoryBadge.js";

interface RoutineOverviewProps {
  stats: RoutineStats | null;
  loading: boolean;
  onOpenCreateModal: () => void;
  onNavigateToSchedule: () => void;
  onNavigateToHistory: () => void;
}

export function RoutineOverview({
  stats,
  loading,
  onOpenCreateModal,
  onNavigateToSchedule,
  onNavigateToHistory,
}: RoutineOverviewProps) {
  if (loading || !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-800/60 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-800/60 rounded-xl" />
          <div className="h-64 bg-gray-800/60 rounded-xl" />
        </div>
      </div>
    );
  }

  const hoursScheduled = Math.round((stats.totalScheduledMinutes / 60) * 10) / 10;
  const hoursCompleted = Math.round((stats.completedMinutes / 60) * 10) / 10;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900/30 to-gray-800/80 border-blue-500/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-300">Completion Rate</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.completionRate}%</h3>
              <p className="text-[11px] text-gray-400 mt-1">
                {stats.completedTasks} of {stats.totalTasks} tasks finished
              </p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
              <TargetIcon size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-900/30 to-gray-800/80 border-emerald-500/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-300">Today's Progress</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {stats.completedTodayCount}/{stats.totalTodayCount}
              </h3>
              <p className="text-[11px] text-gray-400 mt-1">
                {stats.todayCompletionRate}% completed today
              </p>
            </div>
            <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
              <CheckCircle2Icon size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/30 to-gray-800/80 border-purple-500/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-purple-300">Scheduled Time</p>
              <h3 className="text-2xl font-bold text-white mt-1">{hoursScheduled}h</h3>
              <p className="text-[11px] text-gray-400 mt-1">{hoursCompleted}h completed total</p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
              <ClockIcon size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-900/30 to-gray-800/80 border-amber-500/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-300">Task Status</p>
              <div className="flex items-center gap-2 mt-1 text-xs font-semibold text-white">
                <span className="text-emerald-400">Done: {stats.completedTasks}</span>
                <span>•</span>
                <span className="text-blue-400">Plan: {stats.plannedTasks}</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Skipped: {stats.skippedTasks} | In Prog: {stats.inProgressTasks}
              </p>
            </div>
            <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400">
              <FlameIcon size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Section: Category Distribution & Weekly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Card */}
        <Card className="border-gray-700/50">
          <CardHeader className="pb-3 border-b border-gray-700/40 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ActivityIcon size={18} className="text-blue-400" />
                Category Distribution
              </CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">
                Time and task volume by routine category
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {stats.categoryDistribution.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">
                No category data recorded yet.
              </p>
            ) : (
              stats.categoryDistribution.map((cat) => {
                const percentage =
                  stats.totalScheduledMinutes > 0
                    ? Math.round((cat.totalMinutes / stats.totalScheduledMinutes) * 100)
                    : 0;
                const catStyle =
                  CATEGORY_COLORS[cat.category as TaskCategory] || CATEGORY_COLORS.general;

                return (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <TaskCategoryBadge category={cat.category as TaskCategory} />
                        <span className="text-gray-400">
                          ({cat.taskCount} task{cat.taskCount !== 1 ? "s" : ""})
                        </span>
                      </div>
                      <span className="font-medium text-gray-300 font-mono">
                        {Math.round(cat.totalMinutes)} mins ({percentage}%)
                      </span>
                    </div>

                    <div className="w-full bg-gray-700/40 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${catStyle.borderLeft.replace("border-l-", "bg-")} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Weekly Trend Card */}
        <Card className="border-gray-700/50 flex flex-col">
          <CardHeader className="pb-3 border-b border-gray-700/40 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUpIcon size={18} className="text-emerald-400" />
                Last 7 Days Activity
              </CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">
                Daily completion rates across the past week
              </p>
            </div>
          </CardHeader>

          <CardContent className="pt-4 flex-1 flex flex-col justify-between">
            <div className="grid grid-cols-7 gap-2 items-end h-40 pt-4">
              {stats.weeklyTrends.map((day) => {
                const rate = day.total > 0 ? Math.round((day.completed / day.total) * 100) : 0;
                const dayLabel = new Date(`${day.date}T00:00:00`).toLocaleDateString("en-US", {
                  weekday: "short",
                });

                return (
                  <div
                    key={day.date}
                    className="flex flex-col items-center gap-1.5 h-full justify-end"
                  >
                    <span className="text-[10px] text-gray-400 font-mono">
                      {day.completed}/{day.total}
                    </span>
                    <div className="w-full bg-gray-700/40 rounded-t-md relative h-28 flex items-end overflow-hidden">
                      <div
                        className="w-full bg-gradient-to-t from-emerald-600 to-blue-500 rounded-t-md transition-all duration-500"
                        style={{ height: `${Math.max(rate, 5)}%` }}
                        title={`${day.date}: ${rate}% completed`}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-gray-300">{dayLabel}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-700/40 flex items-center justify-between text-xs text-gray-400">
              <span>Overall 7-Day Completion Velocity</span>
              <span className="font-semibold text-emerald-400">{stats.completionRate}% Avg</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Shortcut Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="p-4 bg-gray-800/60 hover:bg-gray-800 border border-gray-700/60 hover:border-blue-500/40 rounded-xl text-left transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg group-hover:bg-blue-500/20 transition-colors">
              <PlusIcon size={20} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-200 group-hover:text-blue-300">
                Add New Routine Task
              </h4>
              <p className="text-xs text-gray-400">Create time blocks & reminders</p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={onNavigateToSchedule}
          className="p-4 bg-gray-800/60 hover:bg-gray-800 border border-gray-700/60 hover:border-emerald-500/40 rounded-xl text-left transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
              <CalendarIcon size={20} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-200 group-hover:text-emerald-300">
                View Today's Schedule
              </h4>
              <p className="text-xs text-gray-400">Manage list & 24h timeline</p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={onNavigateToHistory}
          className="p-4 bg-gray-800/60 hover:bg-gray-800 border border-gray-700/60 hover:border-purple-500/40 rounded-xl text-left transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-lg group-hover:bg-purple-500/20 transition-colors">
              <HistoryIcon size={20} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-200 group-hover:text-purple-300">
                Browse Task History
              </h4>
              <p className="text-xs text-gray-400">Filter past logs & archives</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
