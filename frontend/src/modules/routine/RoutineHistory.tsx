import type { Task, TaskCategory, TaskStatus } from "@lifeos/contracts";
import { getClientDateString } from "@lifeos/contracts";
import {
  Calendar as CalendarIcon,
  CheckCircle2 as CheckCircle2Icon,
  Clock as ClockIcon,
  Filter as FilterIcon,
  RefreshCw as RefreshCwIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Badge from "../../components/ui/Badge.js";
import Button from "../../components/ui/Button.js";
import Card from "../../components/ui/Card.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Input } from "../../components/ui/Input.js";
import { SearchInput } from "../../components/ui/SearchInput.js";
import { Select } from "../../components/ui/Select.js";
import { api } from "../../lib/api.js";
import TaskCategoryBadge from "./TaskCategoryBadge.js";
import { computeDurationMins } from "./TaskList.js";

interface RoutineHistoryProps {
  onViewTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
}

type DateRangePreset = "all" | "7days" | "30days" | "thisMonth" | "custom";

const STATUS_VARIANTS: Record<TaskStatus, "default" | "info" | "success" | "warning"> = {
  planned: "default",
  todo: "default",
  in_progress: "info",
  done: "success",
  skipped: "warning",
  cancelled: "default",
  missed: "warning",
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
      <Card padding="md" className="border-border">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search history by task title or notes..."
                className="w-full bg-card-solid/80 border border-border-subtle/70 text-primary rounded-xl py-2 text-sm focus:outline-none focus:border-blue-500/60"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-border">
            {/* Preset Date Selector */}
            <Select
              label="Timeframe"
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

            {/* Category Filter */}
            <Select
              label="Category"
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

            {/* Status Filter */}
            <Select
              label="Status"
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

            {/* Date Inputs if Custom */}
            {rangePreset === "custom" && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-secondary text-xs">–</span>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* History Metrics Summary Banner */}
      <div className="flex items-center justify-between p-4 bg-surface-elevated rounded-xl border border-border text-xs flex-wrap gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <FilterIcon size={16} className="text-blue-400" />
            <span className="text-secondary">Matching Tasks:</span>
            <span className="font-bold text-primary font-mono text-sm">{totalTasks}</span>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle2Icon size={16} className="text-emerald-400" />
            <span className="text-secondary">Completed Rate:</span>
            <span className="font-bold text-emerald-300 font-mono text-sm">{completionRate}%</span>
          </div>

          <div className="flex items-center gap-2">
            <ClockIcon size={16} className="text-purple-400" />
            <span className="text-secondary">Total Duration:</span>
            <span className="font-bold text-purple-300 font-mono text-sm">{totalHours} hrs</span>
          </div>
        </div>

        <span className="text-secondary text-[11px]">
          Showing routines from {startDate} to {endDate}
        </span>
      </div>

      {/* Task History List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-card rounded-xl animate-pulse" />
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
                className="hover:bg-card-solid/80 transition-all border-border hover:border-border-subtle cursor-pointer"
                onClick={() => onViewTask(task)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-medium text-secondary bg-surface px-2 py-0.5 rounded">
                        {task.date}
                      </span>

                      <span
                        className={`text-sm font-semibold truncate ${
                          task.status === "done"
                            ? "line-through text-secondary"
                            : task.status === "skipped"
                              ? "line-through text-muted"
                              : "text-primary"
                        }`}
                      >
                        {task.title}
                      </span>

                      <TaskCategoryBadge category={task.category} />

                      <Badge variant={STATUS_VARIANTS[task.status]} size="sm">
                        {task.status.replace("_", " ")}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-secondary mt-1">
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
                          <span className="truncate text-secondary max-w-sm">{task.notes}</span>
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
