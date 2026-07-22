import { useCallback, useEffect, useRef, useState } from "react";
import type { DashboardSummary, Task } from "../../packages/contracts/src/index.js";
import DashboardSummaryCard from "./modules/dashboard/DashboardSummary.js";
import TaskForm from "./modules/routine/TaskForm.js";
import TaskList from "./modules/routine/TaskList.js";
import { LearningWidget, SkillsPage } from "./modules/skills";

const POLL_INTERVAL = 30_000;

type Page = "dashboard" | "skills";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const pausedRef = useRef(false);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/routine/tasks?date=${selectedDate}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      setTasks(data);
      setError(null);
    } catch {
      setError("Failed to load tasks");
    }
  }, [selectedDate]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/summary");
      if (!res.ok) throw new Error("Failed to fetch summary");
      const data = await res.json();
      setSummary(data);
      setError(null);
    } catch {
      setError("Failed to load dashboard");
    }
  }, []);

  const fetchAll = useCallback(() => {
    if (pausedRef.current) return;
    fetchTasks();
    fetchSummary();
  }, [fetchTasks, fetchSummary]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAll]);

  useEffect(() => {
    const handleVisibility = () => {
      pausedRef.current = document.hidden;
      if (!document.hidden) fetchAll();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchAll]);

  const handleCreateTask = async (
    input: import("../../packages/contracts/src/index.js").NewTaskInput,
  ) => {
    try {
      const res = await fetch("/api/routine/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to create task");
      const result = await res.json();
      if (result.overlapsWith?.length > 0) {
        alert(`Warning: overlaps with ${result.overlapsWith.length} task(s)`);
      }
      fetchTasks();
    } catch {
      setError("Failed to create task");
    }
  };

  const handleStatusChange = async (id: string, status: Task["status"]) => {
    try {
      const res = await fetch(`/api/routine/tasks/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      fetchTasks();
    } catch {
      setError("Failed to update task status");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold text-center">LifeOS</h1>

        {/* Navigation */}
        <div className="flex justify-center gap-4 border-b border-gray-800 pb-4">
          <button
            type="button"
            onClick={() => setCurrentPage("dashboard")}
            className={`px-4 py-2 font-medium text-sm rounded-md transition-colors ${
              currentPage === "dashboard"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage("skills")}
            className={`px-4 py-2 font-medium text-sm rounded-md transition-colors ${
              currentPage === "skills"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Skills
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded text-sm">
            {error}
          </div>
        )}

        {currentPage === "dashboard" && (
          <>
            <DashboardSummaryCard summary={summary} />
            <LearningWidget onViewAllSessions={() => setCurrentPage("skills")} />

            <div className="flex items-center gap-3">
              <label htmlFor="date-select" className="text-sm text-gray-400">
                Date:
              </label>
              <input
                id="date-select"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-gray-800 text-gray-300 rounded px-3 py-1.5 border border-gray-700"
              />
            </div>

            <TaskForm onSubmit={handleCreateTask} defaultDate={selectedDate} />
            <TaskList tasks={tasks} onStatusChange={handleStatusChange} />
          </>
        )}

        {currentPage === "skills" && <SkillsPage />}
      </div>
    </div>
  );
}
