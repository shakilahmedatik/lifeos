import type { Task, TaskStatus, TaskSubtask } from "@lifeos/contracts";
import {
  Bell as BellIcon,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Edit as EditIcon,
  GraduationCap as GraduationCapIcon,
  Play as PlayIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Badge from "../../components/ui/Badge.js";
import Button from "../../components/ui/Button.js";
import Modal from "../../components/ui/Modal.js";
import { Select } from "../../components/ui/Select.js";
import TaskCategoryBadge from "./TaskCategoryBadge.js";
import { computeDurationMins } from "./TaskList.js";

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleSubtask: (taskId: string, updatedSubtasks: TaskSubtask[]) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
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

export default function TaskDetailModal({
  task,
  onClose,
  onEdit,
  onDelete,
  onToggleSubtask,
  onStatusChange,
}: TaskDetailModalProps) {
  const navigate = useNavigate();
  const duration = computeDurationMins(task.startTime, task.endTime);
  const isOvernight = task.startTime > task.endTime;

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
    <Modal open={true} onClose={onClose} title={task.title} size="md">
      <div className="space-y-4 text-sm">
        <div className="flex items-center gap-2 flex-wrap mb-4">
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
        {/* Time & Duration Info Card */}
        <div className="bg-card p-3.5 rounded-xl border border-border space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <CalendarIcon size={16} className="text-blue-400" />
            <span className="font-medium">{task.date}</span>
          </div>

          <div className="flex items-center gap-2 text-primary">
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

          <div className="pt-2 border-t border-border flex items-center justify-between">
            <span className="text-xs text-secondary shrink-0 mr-2">Status:</span>
            <div className="w-32">
              <Select
                value={task.status}
                onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                options={[
                  { value: "planned", label: "Planned" },
                  { value: "in_progress", label: "In Progress" },
                  { value: "done", label: "Done" },
                  { value: "skipped", label: "Skipped" },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Subtasks Checklist Section */}
        {totalSubtasks > 0 && (
          <div className="bg-card p-3.5 rounded-xl border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">
                Sub-tasks Checklist ({completedSubtasks}/{totalSubtasks})
              </h3>
              <span className="text-xs font-medium text-purple-400">
                {progressPercent}% Completed
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-card-hover h-2 rounded-full overflow-hidden">
              <div
                className="bg-purple-500 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="space-y-2 pt-1">
              {task.subtasks?.map((st) => (
                <label
                  key={st.id}
                  className="flex items-center gap-2.5 p-2 rounded-lg bg-card-hover border border-border-subtle cursor-pointer hover:bg-card-hover transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={st.completed}
                    onChange={() => handleSubtaskCheck(st.id)}
                    className="rounded bg-card-hover border-border-subtle accent-purple-500"
                  />
                  <span
                    className={`text-xs ${st.completed ? "line-through text-muted" : "text-primary"}`}
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
          <div className="bg-card p-3.5 rounded-xl border border-border space-y-1">
            <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">Notes</h3>
            <p className="text-xs text-primary whitespace-pre-wrap leading-relaxed">{task.notes}</p>
          </div>
        )}

        {/* Reminder Info */}
        {task.reminderMinutesBefore && (
          <div className="bg-card p-3.5 rounded-xl border border-border flex items-center gap-2 text-xs text-blue-300">
            <BellIcon size={16} className="text-blue-400" />
            <span>
              Reminder set for {task.reminderMinutesBefore} minutes before (
              {task.reminderSilent ? "Silent" : "Sound Enabled"})
            </span>
          </div>
        )}
      </div>

      {/* Modal Actions */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
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
          {task.category === "workout" && task.referenceId && (
            <Button
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500"
              icon={<PlayIcon size={14} />}
              onClick={() => {
                onClose();
                navigate(`/workouts?startSession=${task.referenceId}&taskId=${task.id}`);
              }}
            >
              Start Workout
            </Button>
          )}

          {task.category === "learning" && task.referenceId && (
            <Button
              variant="primary"
              size="sm"
              className="bg-purple-600 hover:bg-purple-500"
              icon={<GraduationCapIcon size={14} />}
              onClick={() => {
                onClose();
                navigate(
                  `/skills?logSession=${task.referenceId}&taskId=${task.id}&duration=${duration}`,
                );
              }}
            >
              Log Session
            </Button>
          )}

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
    </Modal>
  );
}
