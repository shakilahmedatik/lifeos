import type { Task, TaskStatus, TaskSubtask } from "@lifeos/contracts";
import Badge from "../../components/ui/Badge.js";
import Button from "../../components/ui/Button.js";
import Card from "../../components/ui/Card.js";
import { BellIcon, CalendarIcon, ClockIcon, EditIcon, XIcon } from "../../components/ui/icons.js";
import TaskCategoryBadge, { CATEGORY_COLORS } from "./TaskCategoryBadge.js";
import { computeDurationMins } from "./TaskList.js";

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleSubtask: (taskId: string, updatedSubtasks: TaskSubtask[]) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

const STATUS_VARIANTS: Record<TaskStatus, "info" | "success" | "warning" | "default"> = {
  planned: "default",
  in_progress: "info",
  done: "success",
  skipped: "warning",
};

export default function TaskDetailModal({
  task,
  onClose,
  onEdit,
  onDelete,
  onToggleSubtask,
  onStatusChange,
}: TaskDetailModalProps) {
  const duration = computeDurationMins(task.startTime, task.endTime);
  const isOvernight = task.startTime > task.endTime;
  const catStyle = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.general;

  const totalSubtasks = task.subtasks?.length ?? 0;
  const completedSubtasks = task.subtasks?.filter((st) => st.completed).length ?? 0;
  const progressPercent =
    totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const handleSubtaskCheck = (subtaskId: string) => {
    if (!task.subtasks) return;
    const updated = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st,
    );
    onToggleSubtask(task.id, updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <Card
        className={`w-full max-w-lg border-l-4 ${catStyle.borderLeft} border-gray-700/60 shadow-2xl max-h-[90vh] overflow-y-auto`}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-gray-700/50 mb-4">
          <div className="space-y-1.5 pr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <TaskCategoryBadge category={task.category} />
              <Badge variant={STATUS_VARIANTS[task.status]} size="sm">
                {task.status.replace("_", " ")}
              </Badge>
              {task.recurrence && task.recurrence !== "none" && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                  🔄 Repeat: {task.recurrence}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-100">{task.title}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close task details"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800"
          >
            <XIcon size={20} />
          </button>
        </div>

        <div className="space-y-4 text-sm">
          {/* Time & Duration Info Card */}
          <div className="bg-gray-800/50 p-3.5 rounded-xl border border-gray-700/40 space-y-2">
            <div className="flex items-center gap-2 text-gray-300">
              <CalendarIcon size={16} className="text-blue-400" />
              <span className="font-medium">{task.date}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-300">
              <ClockIcon size={16} className="text-blue-400" />
              <span>
                {task.startTime} – {task.endTime} ({duration} minutes)
              </span>
              {isOvernight && (
                <span className="text-xs text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  🌙 Spans Overnight (+1 day)
                </span>
              )}
            </div>

            {/* Quick Status Selector */}
            <div className="pt-2 border-t border-gray-700/40 flex items-center justify-between">
              <span className="text-xs text-gray-400">Status:</span>
              <select
                value={task.status}
                onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                className="bg-gray-700/70 border border-gray-600/50 text-gray-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500/50 cursor-pointer"
              >
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                <option value="skipped">Skipped</option>
              </select>
            </div>
          </div>

          {/* Subtasks Checklist Section */}
          {totalSubtasks > 0 && (
            <div className="bg-gray-800/50 p-3.5 rounded-xl border border-gray-700/40 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Sub-tasks Checklist ({completedSubtasks}/{totalSubtasks})
                </h3>
                <span className="text-xs font-medium text-purple-400">
                  {progressPercent}% Completed
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-700/50 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-purple-500 h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="space-y-2 pt-1">
                {task.subtasks?.map((st) => (
                  <label
                    key={st.id}
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-700/30 border border-gray-600/30 cursor-pointer hover:bg-gray-700/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => handleSubtaskCheck(st.id)}
                      className="rounded bg-gray-700 border-gray-600 accent-purple-500"
                    />
                    <span
                      className={`text-xs ${st.completed ? "line-through text-gray-500" : "text-gray-200"}`}
                    >
                      {st.title}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Notes Section */}
          {task.notes && (
            <div className="bg-gray-800/50 p-3.5 rounded-xl border border-gray-700/40 space-y-1">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Notes
              </h3>
              <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                {task.notes}
              </p>
            </div>
          )}

          {/* Reminder Info */}
          {task.reminderMinutesBefore && (
            <div className="bg-gray-800/50 p-3.5 rounded-xl border border-gray-700/40 flex items-center gap-2 text-xs text-blue-300">
              <BellIcon size={16} className="text-blue-400" />
              <span>
                Reminder set for {task.reminderMinutesBefore} minutes before (
                {task.reminderSilent ? "Silent" : "Sound Enabled"})
              </span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-700/50">
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              onClose();
              onDelete(task.id);
            }}
          >
            Delete Task
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<EditIcon size={14} />}
              onClick={() => {
                onClose();
                onEdit(task);
              }}
            >
              Edit Task
            </Button>
            <Button size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
