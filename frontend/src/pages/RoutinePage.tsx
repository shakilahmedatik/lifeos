import type {
  NewNotificationInput,
  NewTaskInput,
  RoutineStats,
  Task,
  TaskStatus,
  TaskSubtask,
} from "@lifeos/contracts";
import { getClientDateString } from "@lifeos/contracts";
import {
  Calendar as CalendarIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Plus as PlusIcon,
  RefreshCw as RefreshCwIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAppToast } from "../components/Toast.js";
import Button from "../components/ui/Button.js";
import { Input } from "../components/ui/Input.js";
import ListSkeleton from "../components/ui/ListSkeleton.js";
import { PageHeader } from "../components/ui/PageHeader.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/Tabs.js";
import { api } from "../lib/api.js";
import { useVisibilityPolling } from "../lib/useVisibilityPolling.js";
import DeleteConfirmModal from "../modules/routine/DeleteConfirmModal.js";
import { RoutineHistory } from "../modules/routine/RoutineHistory.js";
import { RoutineOverview } from "../modules/routine/RoutineOverview.js";
import TaskCreateModal from "../modules/routine/TaskCreateModal.js";
import TaskDetailModal from "../modules/routine/TaskDetailModal.js";
import TaskEditModal from "../modules/routine/TaskEditModal.js";
import TaskList from "../modules/routine/TaskList.js";
import TaskTimelineView from "../modules/routine/TaskTimelineView.js";

type Tab = "overview" | "schedule" | "history";
type ViewMode = "list" | "timeline";

export default function RoutinePage() {
  const today = getClientDateString();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [date, setDate] = useState(today);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Overview Stats state
  const [stats, setStats] = useState<RoutineStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const toast = useAppToast();

  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const res = await api.getRoutineStats();
      setStats(res);
    } catch {
      console.error("Failed to load routine statistics");
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      setLoadingTasks(true);
      const data = await api.getTasks(date);
      setTasks(data);
    } catch {
      toast.error("Failed to load tasks schedule");
    } finally {
      setLoadingTasks(false);
    }
  }, [date, toast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Polling tasks
  useVisibilityPolling(fetchTasks, 30_000);

  // Re-fetch stats when visibility changes since they aren't polled
  useEffect(() => {
    const handler = () => {
      if (!document.hidden) {
        fetchStats();
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [fetchStats]);

  // Date Navigation Helpers
  const handleShiftDate = (days: number) => {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split("T")[0]);
  };

  // Create Task
  const handleCreateTask = async (input: NewTaskInput) => {
    try {
      const result = await api.createTask(input);
      fetchTasks();
      fetchStats();
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
      fetchStats();
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
      fetchStats();
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
      fetchStats();
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
      <PageHeader
        title="Routine & Schedule"
        description="Plan, schedule, and execute your day structured by time blocks"
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<PlusIcon size={14} />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Add Task
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} variant="underline">
        <TabsList className="w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview Dashboard */}
        <TabsContent value="overview">
          <RoutineOverview
            stats={stats}
            loading={loadingStats}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onNavigateToSchedule={() => setActiveTab("schedule")}
            onNavigateToHistory={() => setActiveTab("history")}
          />
        </TabsContent>

        {/* Tab 2: Day Schedule & Timeline Planner */}
        <TabsContent value="schedule">
          <div className="space-y-6">
            {/* Header controls: Date selector + View Mode toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-surface-elevated p-3.5 rounded-xl border border-border">
              <div className="flex items-center gap-2 flex-wrap">
                <CalendarIcon size={18} className="text-blue-400 shrink-0" />
                <span className="text-xs font-medium text-secondary shrink-0">
                  Viewing Schedule:
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleShiftDate(-1)}
                    className="p-1 rounded-lg bg-card-hover hover:bg-card-hover text-primary transition-colors"
                    title="Previous Day"
                  >
                    <ChevronLeftIcon size={16} />
                  </button>

                  <div className="w-36">
                    <Input
                      id="routine-date-picker"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleShiftDate(1)}
                    className="p-1 rounded-lg bg-card-hover hover:bg-card-hover text-primary transition-colors"
                    title="Next Day"
                  >
                    <ChevronRightIcon size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 ml-1">
                  {date !== today && (
                    <button
                      type="button"
                      onClick={() => setDate(today)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-colors font-medium"
                    >
                      Jump to Today
                    </button>
                  )}
                  {date === today && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium border border-blue-500/30">
                      Today
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 justify-between sm:justify-end">
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                  <TabsList>
                    <TabsTrigger value="list">List View</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  </TabsList>
                </Tabs>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={<RefreshCwIcon size={14} />}
                  onClick={fetchTasks}
                  aria-label="Refresh task schedule"
                />
              </div>
            </div>

            {/* Content View Area */}
            {loadingTasks ? (
              <ListSkeleton count={3} height="h-16" gap="gap-3" />
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
          </div>
        </TabsContent>

        {/* Tab 3: History & Task Archive */}
        <TabsContent value="history">
          <RoutineHistory
            onViewTask={(task) => setViewingTask(task)}
            onEditTask={(task) => setEditingTask(task)}
          />
        </TabsContent>
      </Tabs>

      {/* Task Creation Modal */}
      <TaskCreateModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTask}
        defaultDate={date}
      />

      {/* Task Detail Modal */}
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

      {/* Task Edit Modal */}
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
