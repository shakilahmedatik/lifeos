import type { Task, TaskCategory, TaskStatus, TaskSubtask } from "@lifeos/contracts";
import {
  Clock as ClockIcon,
  Edit as EditIcon,
  GraduationCap as GraduationCapIcon,
  Play as PlayIcon,
  Search as SearchIcon,
  X as XIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Badge from "../../components/ui/Badge.js";
import Card from "../../components/ui/Card.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Select } from "../../components/ui/Select.js";
import { useRoutineCategories } from "./hooks/useRoutineCategories.js";
import TaskCategoryBadge, { CATEGORY_COLORS } from "./TaskCategoryBadge.js";

interface TaskListProps {
  tasks: Task[];
  onStatusChange: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleSubtask?: (taskId: string, updatedSubtasks: TaskSubtask[]) => void;
}

const STATUS_VARIANTS: Record<TaskStatus, "default" | "info" | "success" | "warning"> = {
  planned: "default",
  todo: "default",
  in_progress: "info",
  done: "success",
  skipped: "warning",
  cancelled: "default",
  missed: "warning",
};

export function computeDurationMins(startTime: string, endTime: string): number {
  const [sH, sM] = startTime.split(":").map(Number);
  const [eH, eM] = endTime.split(":").map(Number);
  const start = sH * 60 + sM;
  const end = eH * 60 + eM;
  return start < end ? end - start : 1440 - start + end;
}

export default function TaskList({
  tasks,
  onStatusChange,
  onEdit,
  onDelete,
  onToggleSubtask,
}: TaskListProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | "all">("all");
  const { categories: routineCategories } = useRoutineCategories();

  const categoryOptions = useMemo(() => {
    const base = [{ value: "all", label: "All Categories" }];
    if (routineCategories && routineCategories.length > 0) {
      return [
        ...base,
        ...routineCategories.map((c) => ({
          value: c.id,
          label: `${c.icon ? `${c.icon} ` : ""}${c.name}`,
        })),
      ];
    }
    return [
      ...base,
      { value: "general", label: "General" },
      { value: "routine", label: "Routine" },
      { value: "must_do", label: "Must Do" },
      { value: "work", label: "Work" },
      { value: "workout", label: "Workout" },
      { value: "learning", label: "Learning" },
      { value: "habit", label: "Habit" },
      { value: "personal", label: "Personal" },
      { value: "flex", label: "Flex" },
    ];
  }, [routineCategories]);

  const filteredTasks = tasks.filter((t) => {
    if (categoryFilter !== "all" && t.category !== categoryFilter) {
      // Also check category name match
      const matched = routineCategories.find((c) => c.id === categoryFilter);
      if (!matched || matched.name.toLowerCase() !== t.category?.toLowerCase()) {
        return false;
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchNotes = t.notes?.toLowerCase().includes(q);
      if (!matchTitle && !matchNotes) return false;
    }
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-4">
      {/* Search and Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-surface-elevated p-3 rounded-xl border border-border">
        <div className="relative flex-1 w-full">
          <SearchIcon size={14} className="absolute left-3 top-2.5 text-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search today's tasks..."
            className="w-full bg-card-hover border border-border-subtle text-primary text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        <div className="w-full sm:w-48 shrink-0">
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as TaskCategory | "all")}
            options={categoryOptions}
          />
        </div>
      </div>

      {sortedTasks.length === 0 ? (
        <EmptyState
          icon={ClockIcon}
          title={
            tasks.length === 0 ? "No tasks scheduled for this day" : "No tasks match your filters"
          }
          description={
            tasks.length === 0
              ? 'Use the "Add Task" button above to plan your day or set up recurring routines.'
              : "Try clearing your search query or changing the category filter."
          }
        />
      ) : (
        <div className="space-y-3">
          {sortedTasks.map((task) => {
            const matchedCategoryObj = routineCategories.find(
              (c) =>
                c.id === task.category || c.name.toLowerCase() === task.category?.toLowerCase(),
            );
            const catStyle = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.general;
            const duration = computeDurationMins(task.startTime, task.endTime);
            const isOvernight = task.startTime > task.endTime;
            const hasSubtasks = task.subtasks && task.subtasks.length > 0;
            const completedSubtasks = task.subtasks?.filter((st) => st.completed).length ?? 0;

            const handleSubtaskCheck = (subtaskId: string) => {
              if (!task.subtasks) return;
              const updated = task.subtasks.map((st) =>
                st.id === subtaskId ? { ...st, completed: !st.completed } : st,
              );
              onToggleSubtask?.(task.id, updated);
            };

            return (
              <Card
                key={task.id}
                padding="sm"
                className={`border-l-4 ${catStyle.borderLeft} transition-all hover:bg-card-solid/80`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
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

                      <TaskCategoryBadge
                        category={task.category}
                        categoryObj={matchedCategoryObj}
                        categories={routineCategories}
                      />

                      <Badge variant={STATUS_VARIANTS[task.status]} size="sm">
                        {task.status.replace("_", " ")}
                      </Badge>

                      {task.recurrence && task.recurrence !== "none" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase font-medium">
                          🔄 {task.recurrence}
                        </span>
                      )}

                      {hasSubtasks && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
                          ☑️ {completedSubtasks}/{task.subtasks?.length} subtasks
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-secondary mt-1">
                      <span>
                        {task.startTime} – {task.endTime}
                      </span>
                      <span>•</span>
                      <span>{duration} mins</span>
                      {isOvernight && <span className="text-amber-400">🌙 (+1 day)</span>}
                      {task.notes && (
                        <>
                          <span>•</span>
                          <span className="truncate text-secondary max-w-xs">{task.notes}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {task.category === "workout" && task.referenceId && (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/workouts?startSession=${task.referenceId}&taskId=${task.id}`)
                        }
                        className="flex items-center gap-1 text-xs px-2 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-600/30 transition-colors"
                        title="Start Workout Session"
                      >
                        <PlayIcon size={12} />
                        <span>Start</span>
                      </button>
                    )}

                    {task.category === "learning" && task.referenceId && (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/skills?logSession=${task.referenceId}&taskId=${task.id}&duration=${duration}`,
                          )
                        }
                        className="flex items-center gap-1 text-xs px-2 py-1 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-lg hover:bg-purple-600/30 transition-colors"
                        title="Log Learning Session"
                      >
                        <GraduationCapIcon size={12} />
                        <span>Log Session</span>
                      </button>
                    )}

                    <label htmlFor={`status-select-${task.id}`} className="sr-only">
                      Change status for {task.title}
                    </label>
                    <select
                      id={`status-select-${task.id}`}
                      value={task.status}
                      onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                      className="bg-card-hover border border-border-subtle text-primary text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500/50 cursor-pointer"
                    >
                      <option value="planned">Planned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                      <option value="skipped">Skipped</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => onEdit(task)}
                      aria-label={`Edit task ${task.title}`}
                      className="p-1.5 rounded-lg text-secondary hover:text-blue-400 hover:bg-card-hover transition-colors"
                      title="Edit task"
                    >
                      <EditIcon size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(task.id)}
                      aria-label={`Delete task ${task.title}`}
                      className="p-1.5 rounded-lg text-secondary hover:text-red-400 hover:bg-red-900/30 transition-colors"
                      title="Delete task"
                    >
                      <XIcon size={14} />
                    </button>
                  </div>
                </div>

                {/* Subtasks Checklist rendered inside Card */}
                {hasSubtasks && (
                  <div className="mt-2.5 pt-2 border-t border-border space-y-1 pl-1">
                    {task.subtasks?.map((st) => (
                      <label
                        key={st.id}
                        className="flex items-center gap-2 text-xs text-primary cursor-pointer select-none hover:text-primary"
                      >
                        <input
                          type="checkbox"
                          checked={st.completed}
                          onChange={() => handleSubtaskCheck(st.id)}
                          className="rounded bg-card-hover border-border-subtle accent-blue-500"
                        />
                        <span className={st.completed ? "line-through text-muted" : ""}>
                          {st.title}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
