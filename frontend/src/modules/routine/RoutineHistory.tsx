import type { Task, TaskCategory, TaskStatus } from "@lifeos/contracts";
import { getClientDateString } from "@lifeos/contracts";
import {
  Calendar as CalendarIcon,
  CheckCircle2 as CheckCircle2Icon,
  Clock as ClockIcon,
  Filter as FilterIcon,
  RefreshCw as RefreshCwIcon,
  Search as SearchIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Badge from "../../components/ui/Badge.js";
import Button from "../../components/ui/Button.js";
import Card from "../../components/ui/Card.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Input } from "../../components/ui/Input.js";
import { Select } from "../../components/ui/Select.js";
import { api } from "../../lib/api.js";
import TaskCategoryBadge from "./TaskCategoryBadge.js";
import { computeDurationMins } from "./TaskList.js";

interface RoutineHistoryProps {
  onViewTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
}

type DateRangePreset = "all" | "7days" | "30days" | "thisMonth" | "custom";

const STATUS_VARIANTS: Record<TaskStatus, "info" | "success" | "warning" | "default"> = {
  planned: "default",
  in_progress: "info",
  done: "success",
  skipped: "warning",
};

export function RoutineHistory({ onViewTask, onEditTask }: RoutineHistoryProps) {
  const todayStr = getClientDateString();
  const [rangePreset, setRangePreset] = useState<DateRangePreset>("30days");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(todayStr);

  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getTaskHistory({
        startDate: rangePreset === "all" ? undefined : startDate,
        endDate: rangePreset === "all" ? undefined : endDate,
        category: categoryFilter,
        status: statusFilter,
        search: searchQuery,
      });
      setTasks(data);
    } catch {
      console.error("Failed to load task history");
    }
    setLoading(false);
  }, [startDate, endDate, rangePreset, categoryFilter, statusFilter, searchQuery]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleRangePresetChange = (preset: DateRangePreset) => {
    setRangePreset(preset);
    const now = new Date();
    if (preset === "7days") {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      setStartDate(d.toISOString().split("T")[0]);
      setEndDate(todayStr);
    } else if (preset === "30days") {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      setStartDate(d.toISOString().split("T")[0]);
      setEndDate(todayStr);
    } else if (preset === "thisMonth") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(firstDay.toISOString().split("T")[0]);
      setEndDate(todayStr);
    }
  };

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const totalMinutes = tasks.reduce(
    (sum, t) => sum + computeDurationMins(t.startTime, t.endTime),
    0,
  );
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search & Filters Section */}
      <Card padding="md" className="border-gray-700/50">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <SearchIcon size={16} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history by task title or notes..."
                className="w-full bg-gray-800/80 border border-gray-700/70 text-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500/60"
              />
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCwIcon size={14} />}
              onClick={fetchHistory}
            >
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-gray-800">
            {/* Preset Date Selector */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Timeframe</label>
              <Select
                value={rangePreset}
                onChange={(e) => handleRangePresetChange(e.target.value as DateRangePreset)}
                options={[
                  { value: "7days", label: "Last 7 Days" },
                  { value: "30days", label: "Last 30 Days" },
                  { value: "thisMonth", label: "This Month" },
                  { value: "all", label: "All Time" },
                  { value: "custom", label: "Custom Range" },
                ]}
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Category</label>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as TaskCategory | "all")}
                options={[
                  { value: "all", label: "All Categories" },
                  { value: "general", label: "General" },
                  { value: "work", label: "Work" },
                  { value: "workout", label: "Workout" },
                  { value: "learning", label: "Learning" },
                  { value: "habit", label: "Habit" },
                  { value: "personal", label: "Personal" },
                ]}
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "all")}
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "done", label: "Done" },
                  { value: "planned", label: "Planned" },
                  { value: "in_progress", label: "In Progress" },
                  { value: "skipped", label: "Skipped" },
                ]}
              />
            </div>

            {/* Date Inputs if Custom */}
            {rangePreset === "custom" && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-gray-400 text-xs">–</span>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* History Metrics Summary Banner */}
      <div className="flex items-center justify-between p-4 bg-gray-800/40 rounded-xl border border-gray-700/40 text-xs flex-wrap gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <FilterIcon size={16} className="text-blue-400" />
            <span className="text-gray-400">Matching Tasks:</span>
            <span className="font-bold text-gray-100 font-mono text-sm">{totalTasks}</span>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle2Icon size={16} className="text-emerald-400" />
            <span className="text-gray-400">Completed Rate:</span>
            <span className="font-bold text-emerald-300 font-mono text-sm">{completionRate}%</span>
          </div>

          <div className="flex items-center gap-2">
            <ClockIcon size={16} className="text-purple-400" />
            <span className="text-gray-400">Total Duration:</span>
            <span className="font-bold text-purple-300 font-mono text-sm">{totalHours} hrs</span>
          </div>
        </div>

        <span className="text-gray-400 text-[11px]">
          Showing routines from {startDate} to {endDate}
        </span>
      </div>

      {/* Task History List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-800/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CalendarIcon}
          title="No routine tasks found"
          description="Try adjusting your date range, status, category, or search filters."
        />
      ) : (
        <div className="space-y-2.5">
          {tasks.map((task) => {
            const duration = computeDurationMins(task.startTime, task.endTime);
            const subtaskCount = task.subtasks?.length ?? 0;
            const completedSubtaskCount = task.subtasks?.filter((s) => s.completed).length ?? 0;

            return (
              <Card
                key={`${task.id}_${task.date}`}
                padding="sm"
                className="hover:bg-gray-800/80 transition-all border-gray-800 hover:border-gray-700 cursor-pointer"
                onClick={() => onViewTask(task)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-medium text-gray-400 bg-gray-900/60 px-2 py-0.5 rounded">
                        {task.date}
                      </span>

                      <span
                        className={`text-sm font-semibold truncate ${
                          task.status === "done"
                            ? "line-through text-gray-400"
                            : task.status === "skipped"
                              ? "line-through text-gray-500"
                              : "text-gray-100"
                        }`}
                      >
                        {task.title}
                      </span>

                      <TaskCategoryBadge category={task.category} />

                      <Badge variant={STATUS_VARIANTS[task.status]} size="sm">
                        {task.status.replace("_", " ")}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <span className="font-mono">
                        {task.startTime} – {task.endTime} ({duration}m)
                      </span>
                      {subtaskCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-purple-300">
                            ☑️ {completedSubtaskCount}/{subtaskCount} subtasks
                          </span>
                        </>
                      )}
                      {task.notes && (
                        <>
                          <span>•</span>
                          <span className="truncate text-gray-400 max-w-sm">{task.notes}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTask(task);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
