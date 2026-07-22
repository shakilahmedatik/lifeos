import { useEffect, useState, useCallback, useRef } from "react";
import type { Task, NewTaskInput, TaskCategory, TaskStatus } from "../../../packages/contracts/src/index.js";
import { api } from "../lib/api.js";
import Card, { CardHeader, CardTitle } from "../components/ui/Card.js";
import Badge from "../components/ui/Badge.js";
import Button from "../components/ui/Button.js";
import { PlusIcon, CalendarIcon, RefreshCwIcon, XIcon } from "../components/ui/icons.js";

const CATEGORY_STYLES: Record<TaskCategory, string> = {
  work: "border-l-blue-500/70",
  workout: "border-l-red-500/70",
  learning: "border-l-purple-500/70",
  habit: "border-l-orange-500/70",
  personal: "border-l-pink-500/70",
  general: "border-l-gray-500/70",
};

const STATUS_VARIANTS: Record<TaskStatus, "info" | "success" | "warning" | "default"> = {
  planned: "default",
  in_progress: "info",
  done: "success",
  skipped: "warning",
};

export default function RoutinePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(today);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TaskCategory>("general");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const pausedRef = useRef(false);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await api.getTasks(date);
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 30_000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  useEffect(() => {
    const handler = () => {
      pausedRef.current = document.hidden;
      if (!document.hidden) fetchTasks();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [fetchTasks]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const input: NewTaskInput = {
        title: title.trim(),
        category,
        date,
        startTime,
        endTime,
        notes: notes.trim() || undefined,
      };
      await api.createTask(input);
      setTitle("");
      setNotes("");
      setShowForm(false);
      fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    }
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    try {
      await api.updateTaskStatus(id, status);
      fetchTasks();
    } catch {
      setError("Failed to update task");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTask(id);
      fetchTasks();
    } catch {
      setError("Failed to delete task");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">Plan and manage your day</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCwIcon size={14} />}
            onClick={fetchTasks}
          />
          <Button
            size="sm"
            icon={<PlusIcon size={14} />}
            onClick={() => setShowForm(!showForm)}
          >
            Add Task
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800/50 text-red-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <XIcon size={14} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <CalendarIcon size={16} className="text-gray-500" />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-gray-800/60 border border-gray-700/50 text-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500/50"
        />
      </div>

      {showForm && (
        <Card className="border-blue-500/20">
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you need to do?"
              className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-500"
              required
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
              >
                <option value="general">General</option>
                <option value="work">Work</option>
                <option value="workout">Workout</option>
                <option value="learning">Learning</option>
                <option value="habit">Habit</option>
                <option value="personal">Personal</option>
              </select>
              <div>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <Button type="submit" size="sm" className="w-full">
                Create
              </Button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              rows={2}
              className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-500 resize-none"
            />
          </form>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-800/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <Card className="text-center py-8">
          <CalendarIcon size={32} className="text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No tasks scheduled for this day</p>
          <Button
            variant="secondary"
            size="sm"
            icon={<PlusIcon size={14} />}
            onClick={() => setShowForm(true)}
            className="mt-3"
          >
            Create your first task
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <Card
              key={task.id}
              padding="sm"
              className={`flex items-center gap-4 ${CATEGORY_STYLES[task.category]}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-200 truncate">
                    {task.title}
                  </span>
                  <Badge variant={STATUS_VARIANTS[task.status]} size="sm">
                    {task.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {task.startTime} – {task.endTime}
                  {task.notes && <span className="ml-2">· {task.notes}</span>}
                </p>
              </div>
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                className="bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500/50 cursor-pointer"
              >
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                <option value="skipped">Skipped</option>
              </select>
              <button
                onClick={() => handleDelete(task.id)}
                className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-900/30 transition-colors"
              >
                <XIcon size={14} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
