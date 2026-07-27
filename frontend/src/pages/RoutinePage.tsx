import type {
  NewNotificationInput,
  NewTaskInput,
  Task,
  TaskStatus,
  TaskSubtask,
} from "@lifeos/contracts";
import { getClientDateString } from "@lifeos/contracts";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAppToast } from "../components/Toast.js";
import Button from "../components/ui/Button.js";
import { CalendarIcon, PlusIcon, RefreshCwIcon } from "../components/ui/icons.js";
import { api } from "../lib/api.js";
import DeleteConfirmModal from "../modules/routine/DeleteConfirmModal.js";
import TaskDetailModal from "../modules/routine/TaskDetailModal.js";
import TaskEditModal from "../modules/routine/TaskEditModal.js";
import TaskForm from "../modules/routine/TaskForm.js";
import TaskList from "../modules/routine/TaskList.js";
import TaskTimelineView from "../modules/routine/TaskTimelineView.js";

type ViewMode = "list" | "timeline";

export default function RoutinePage() {
  const today = getClientDateString();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(today);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showForm, setShowForm] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const pausedRef = useRef(false);
  const toast = useAppToast();

  const fetchTasks = useCallback(async () => {
    try {
      const data = await api.getTasks(date);
      setTasks(data);
    } catch {
      toast.error("Failed to load tasks schedule");
    } finally {
      setLoading(false);
    }
  }, [date, toast]);

  // Polling with FIXED Tab Visibility Leak
  useEffect(() => {
    fetchTasks();
    const interval = setInterval(() => {
      if (!pausedRef.current) {
        fetchTasks();
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  useEffect(() => {
    const handler = () => {
      pausedRef.current = document.hidden;
      if (!document.hidden) {
        fetchTasks();
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [fetchTasks]);

  // Create Task
  const handleCreateTask = async (input: NewTaskInput) => {
    try {
      const result = await api.createTask(input);
      setShowForm(false);
      fetchTasks();
      toast.success("Task created successfully");

      if (result.overlapsWith && result.overlapsWith.length > 0) {
        const titles = result.overlapsWith.map((t) => `"${t.title}"`).join(", ");
        toast.warning(`Note: Task overlaps with ${titles}`);
      }

      if (input.reminderMinutesBefore) {
        try {
          const [y, m, d] = input.date.split("-").map(Number);
          const [hh, mm] = input.startTime.split(":").map(Number);
          const dt = new Date(y, m - 1, d, hh, mm);
          dt.setMinutes(dt.getMinutes() - input.reminderMinutesBefore);

          const soundType = input.reminderSound || (input.reminderSilent ? undefined : "default");

          await api.createNotification({
            taskId: result.task.id,
            reminderTime: dt.toISOString(),
            soundType: soundType as NewNotificationInput["soundType"],
          });
        } catch {
          toast.warning("Task created, but failed to schedule reminder notification");
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create task");
      throw err;
    }
  };

  // Optimistic Status Update
  const handleStatusChange = async (id: string, newStatus: TaskStatus) => {
    const previousTasks = [...tasks];

    // Optimistically update local state
    setTasks((current) => current.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
    if (viewingTask?.id === id) {
      setViewingTask((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      await api.updateTaskStatus(id, newStatus);
    } catch {
      // Rollback on failure
      setTasks(previousTasks);
      toast.error("Failed to update task status");
    }
  };

  // Update Task
  const handleUpdateTask = async (id: string, patch: Partial<Task>) => {
    try {
      const result = await api.updateTask(id, patch);
      fetchTasks();
      toast.success("Task updated");

      if (result.overlapsWith && result.overlapsWith.length > 0) {
        const titles = result.overlapsWith.map((t) => `"${t.title}"`).join(", ");
        toast.warning(`Note: Task overlaps with ${titles}`);
      }

      // Sync notification if reminder settings or timing changed
      if (result.task.reminderMinutesBefore) {
        try {
          await api.deleteNotificationsByTaskId(id);
          const [y, m, d] = result.task.date.split("-").map(Number);
          const [hh, mm] = result.task.startTime.split(":").map(Number);
          const dt = new Date(y, m - 1, d, hh, mm);
          dt.setMinutes(dt.getMinutes() - result.task.reminderMinutesBefore);

          const soundType =
            patch.reminderSound || (result.task.reminderSilent ? undefined : "default");

          await api.createNotification({
            taskId: result.task.id,
            reminderTime: dt.toISOString(),
            soundType: soundType as NewNotificationInput["soundType"],
          });
        } catch {
          // Non-blocking notification sync warning
        }
      } else if (patch.reminderMinutesBefore === null) {
        try {
          await api.deleteNotificationsByTaskId(id);
        } catch {
          // Ignore delete notification failure
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update task");
      throw err;
    }
  };

  // Optimistic Toggle Subtask
  const handleToggleSubtask = async (taskId: string, updatedSubtasks: TaskSubtask[]) => {
    setTasks((current) =>
      current.map((t) => (t.id === taskId ? { ...t, subtasks: updatedSubtasks } : t)),
    );
    if (viewingTask?.id === taskId) {
      setViewingTask((prev) => (prev ? { ...prev, subtasks: updatedSubtasks } : null));
    }

    try {
      await api.updateTask(taskId, { subtasks: updatedSubtasks });
    } catch {
      fetchTasks();
    }
  };

  // Optimistic Delete Task
  const handleConfirmDelete = async () => {
    if (!deletingTaskId) return;
    const idToDelete = deletingTaskId;
    const previousTasks = [...tasks];

    // Optimistically update local state
    setTasks((current) => current.filter((t) => t.id !== idToDelete));
    setDeletingTaskId(null);
    if (viewingTask?.id === idToDelete) {
      setViewingTask(null);
    }

    try {
      await api.deleteTask(idToDelete);
      toast.success("Task deleted");
    } catch {
      // Rollback on failure
      setTasks(previousTasks);
      toast.error("Failed to delete task");
    }
  };

  const taskBeingDeleted = tasks.find((t) => t.id === deletingTaskId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Routine & Schedule</h1>
          <p className="text-sm text-gray-400 mt-1">
            Plan, schedule, and execute your day structured by time blocks
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="bg-gray-800/80 p-1 rounded-lg border border-gray-700/50 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === "list" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              List
            </button>

            <button
              type="button"
              onClick={() => setViewMode("timeline")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === "timeline"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Timeline
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCwIcon size={14} />}
            onClick={fetchTasks}
            aria-label="Refresh task schedule"
          />

          <Button size="sm" icon={<PlusIcon size={14} />} onClick={() => setShowForm(!showForm)}>
            Add Task
          </Button>
        </div>
      </div>

      {/* Date Selector */}
      <div className="flex items-center gap-3 bg-gray-800/40 p-3 rounded-xl border border-gray-700/40">
        <CalendarIcon size={18} className="text-blue-400" />
        <label htmlFor="routine-date-picker" className="text-xs font-medium text-gray-400">
          Viewing Schedule For:
        </label>
        <input
          id="routine-date-picker"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-gray-700/60 border border-gray-600/50 text-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500/50"
        />
        {date === today && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium">
            Today
          </span>
        )}
      </div>

      {/* Task Creation Form */}
      {showForm && (
        <TaskForm
          onSubmit={handleCreateTask}
          onCancel={() => setShowForm(false)}
          defaultDate={date}
        />
      )}

      {/* Content Area */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-800/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : viewMode === "list" ? (
        <TaskList
          tasks={tasks}
          onStatusChange={handleStatusChange}
          onEdit={(task) => setEditingTask(task)}
          onDelete={(id) => setDeletingTaskId(id)}
          onToggleSubtask={handleToggleSubtask}
        />
      ) : (
        <TaskTimelineView
          tasks={tasks}
          selectedDate={date}
          todayDate={today}
          onViewTask={(task) => setViewingTask(task)}
        />
      )}

      {/* Detail Modal */}
      {viewingTask && (
        <TaskDetailModal
          task={viewingTask}
          onClose={() => setViewingTask(null)}
          onEdit={(task) => setEditingTask(task)}
          onDelete={(id) => setDeletingTaskId(id)}
          onToggleSubtask={handleToggleSubtask}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Edit Modal */}
      {editingTask && (
        <TaskEditModal
          task={editingTask}
          onSave={handleUpdateTask}
          onClose={() => setEditingTask(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingTaskId && taskBeingDeleted && (
        <DeleteConfirmModal
          taskTitle={taskBeingDeleted.title}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingTaskId(null)}
        />
      )}
    </div>
  );
}
