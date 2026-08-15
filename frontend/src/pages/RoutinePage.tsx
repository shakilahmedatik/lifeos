import type { NewTaskInput, Task, TaskStatus, TaskSubtask } from "@lifeos/contracts";
import { getClientDateString } from "@lifeos/contracts";
import {
  Calendar as CalendarIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Plus as PlusIcon,
  RefreshCw as RefreshCwIcon,
} from "lucide-react";
import { useState } from "react";
import Button from "../components/ui/Button.js";
import { Input } from "../components/ui/Input.js";
import ListSkeleton from "../components/ui/ListSkeleton.js";
import { PageHeader } from "../components/ui/PageHeader.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/Tabs.js";
import DeleteConfirmModal from "../modules/routine/DeleteConfirmModal.js";

import { useRoutineStats } from "../modules/routine/hooks/useRoutineStats.js";
import { useRoutineTasks } from "../modules/routine/hooks/useRoutineTasks.js";
import { RoutineCategoryManager } from "../modules/routine/RoutineCategoryManager.js";
import { RoutineHistory } from "../modules/routine/RoutineHistory.js";
import { RoutineOverview } from "../modules/routine/RoutineOverview.js";
import TaskCreateModal from "../modules/routine/TaskCreateModal.js";
import TaskDetailModal from "../modules/routine/TaskDetailModal.js";
import TaskEditModal from "../modules/routine/TaskEditModal.js";
import TaskList from "../modules/routine/TaskList.js";
import TaskTimelineView from "../modules/routine/TaskTimelineView.js";

type Tab = "overview" | "schedule" | "history" | "categories";
type ViewMode = "list" | "timeline";

export default function RoutinePage() {
  const today = getClientDateString();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [date, setDate] = useState(today);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // TanStack Query Hooks
  const { stats, loading: loadingStats } = useRoutineStats();
  const {
    tasks,
    loading: loadingTasks,
    refetch: fetchTasks,
    createTask,
    updateStatus,
    updateTask,
    toggleSubtask,
    deleteTask,
  } = useRoutineTasks(date);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Date Navigation Helpers
  const handleShiftDate = (days: number) => {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split("T")[0]);
  };

  const handleCreateTask = async (input: NewTaskInput) => {
    await createTask(input);
  };

  const handleStatusChange = async (id: string, newStatus: TaskStatus) => {
    if (viewingTask?.id === id) {
      setViewingTask((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    await updateStatus({ id, status: newStatus });
  };

  const handleUpdateTask = async (id: string, patch: Partial<Task>) => {
    await updateTask({ id, patch });
  };

  const handleToggleSubtask = async (taskId: string, updatedSubtasks: TaskSubtask[]) => {
    if (viewingTask?.id === taskId) {
      setViewingTask((prev) => (prev ? { ...prev, subtasks: updatedSubtasks } : null));
    }
    await toggleSubtask({ taskId, subtasks: updatedSubtasks });
  };

  const handleConfirmDelete = async () => {
    if (!deletingTaskId) return;
    const idToDelete = deletingTaskId;
    setDeletingTaskId(null);
    if (viewingTask?.id === idToDelete) {
      setViewingTask(null);
    }
    await deleteTask(idToDelete);
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
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview Dashboard */}
        <TabsContent value="overview">
          <RoutineOverview stats={stats} loading={loadingStats} />
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
                  onClick={() => fetchTasks()}
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

        {/* Tab 4: Routine Categories Management */}
        <TabsContent value="categories">
          <RoutineCategoryManager />
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
