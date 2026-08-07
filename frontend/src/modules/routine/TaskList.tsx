import type { Task, TaskCategory, TaskStatus, TaskSubtask } from "@lifeos/contracts";
import {
  Clock as ClockIcon,
  Edit as EditIcon,
  GraduationCap as GraduationCapIcon,
  Play as PlayIcon,
  Search as SearchIcon,
  X as XIcon,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Badge from "../../components/ui/Badge.js";
import Card from "../../components/ui/Card.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Select } from "../../components/ui/Select.js";
import TaskCategoryBadge, { CATEGORY_COLORS } from "./TaskCategoryBadge.js";

interface TaskListProps {
  tasks: Task[];
  onStatusChange: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleSubtask?: (taskId: string, updatedSubtasks: TaskSubtask[]) => void;
}

const STATUS_VARIANTS: Record<TaskStatus, "info" | "success" | "warning" | "default"> = {
  planned: "default",
  in_progress: "info",
  done: "success",
  skipped: "warning",
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

  const filteredTasks = tasks.filter((t) => {
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
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
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-gray-800/40 p-3 rounded-xl border border-gray-700/40">
        <div className="relative flex-1 w-full">
          <SearchIcon size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search today's tasks..."
            className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        <div className="w-full sm:w-48 shrink-0">
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
                className={`border-l-4 ${catStyle.borderLeft} transition-all hover:bg-gray-800/80`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
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

                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <span>
                        {task.startTime} – {task.endTime}
                      </span>
                      <span>•</span>
                      <span>{duration} mins</span>
                      {isOvernight && <span className="text-amber-400">🌙 (+1 day)</span>}
                      {task.notes && (
                        <>
                          <span>•</span>
                          <span className="truncate text-gray-400 max-w-xs">{task.notes}</span>
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
                      className="bg-gray-700/60 border border-gray-600/50 text-gray-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500/50 cursor-pointer"
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
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-gray-700/60 transition-colors"
                      title="Edit task"
                    >
                      <EditIcon size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(task.id)}
                      aria-label={`Delete task ${task.title}`}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/30 transition-colors"
                      title="Delete task"
                    >
                      <XIcon size={14} />
                    </button>
                  </div>
                </div>

                {/* Subtasks Checklist rendered inside Card */}
                {hasSubtasks && (
                  <div className="mt-2.5 pt-2 border-t border-gray-700/40 space-y-1 pl-1">
                    {task.subtasks?.map((st) => (
                      <label
                        key={st.id}
                        className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none hover:text-gray-100"
                      >
                        <input
                          type="checkbox"
                          checked={st.completed}
                          onChange={() => handleSubtaskCheck(st.id)}
                          className="rounded bg-gray-700 border-gray-600 accent-blue-500"
                        />
                        <span className={st.completed ? "line-through text-gray-500" : ""}>
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
