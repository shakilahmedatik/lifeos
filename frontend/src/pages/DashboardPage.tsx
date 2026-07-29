import type { DashboardSummary, HabitWithStreak, Task } from "@lifeos/contracts";
import { getClientDateString } from "@lifeos/contracts/date-utils";
import {
  ArrowRight as ArrowRightIcon,
  CheckCheck as CheckCheckIcon,
  GraduationCap as GraduationCapIcon,
  Play as PlayIcon,
  RefreshCw as RefreshCwIcon,
  Timer as TimerIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppToast } from "../components/Toast.js";
import Badge from "../components/ui/Badge.js";
import Button from "../components/ui/Button.js";
import Card, { CardHeader, CardTitle } from "../components/ui/Card.js";
import { api } from "../lib/api.js";
import { WorkoutWidget } from "../modules/workouts/WorkoutWidget.js";

const POLL_INTERVAL = 30_000;

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pausedRef = useRef(false);
  const toast = useAppToast();
  const navigate = useNavigate();

  const fetchSummary = useCallback(async () => {
    try {
      const today = getClientDateString();
      const data = await api.getSummary(today);
      setSummary(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchSummary]);

  useEffect(() => {
    const handleVisibility = () => {
      pausedRef.current = document.hidden;
      if (!document.hidden) fetchSummary();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchSummary]);

  const handleHabitToggle = async (habitId: string) => {
    if (!summary) return;
    const habit = summary.dueHabits.find((h) => h.id === habitId);
    if (!habit) return;
    try {
      const today = getClientDateString();
      if (habit.loggedToday) {
        await api.unlogHabit(habitId, today);
      } else {
        await api.logHabit(habitId, today);
      }
      fetchSummary();
    } catch {
      toast.error("Failed to update habit");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-800 rounded-lg animate-pulse" />
            <div className="h-4 w-32 bg-gray-800 rounded-lg animate-pulse mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 bg-gray-800/60 rounded-xl animate-pulse" />
          <div className="h-32 bg-gray-800/60 rounded-xl animate-pulse" />
        </div>
        <div className="h-24 bg-gray-800/60 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {error && (
        <div className="bg-red-900/30 border border-red-800/50 text-red-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          {error}
          <button
            onClick={fetchSummary}
            className="ml-auto text-red-400 hover:text-red-200 underline text-xs"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCwIcon size={14} />}
          onClick={fetchSummary}
        >
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NowCard task={summary?.now ?? null} navigate={navigate} />
        <NextCard task={summary?.next ?? null} />
      </div>

      <TaskProgress done={summary?.todayDoneCount ?? 0} total={summary?.todayCount ?? 0} />

      {summary?.dueHabits && summary.dueHabits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <CheckCheckIcon size={16} className="text-emerald-400" />
              <span>Today's Habits</span>
            </CardTitle>
          </CardHeader>
          <div className="flex flex-wrap gap-2">
            {summary.dueHabits.map((habit) => (
              <HabitChip
                key={habit.id}
                habit={habit}
                onToggle={() => handleHabitToggle(habit.id)}
              />
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1">
        <WorkoutWidget
          onSelectWorkout={() => navigate("/workouts")}
          onViewHistory={() => navigate("/workouts")}
        />
      </div>
    </div>
  );
}

function NowCard({ task, navigate }: { task: Task | null; navigate: (path: string) => void }) {
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (!task) return;
    const tick = () => {
      // Client clock = "when is this task's end time, ticking live" (wall-clock countdown)
      // Server date = "what day to show tasks for" — that's handled by fetchSummary with ?date=
      const now = new Date();
      const [h, m] = task.endTime.split(":").map(Number);
      const end = new Date(now);
      end.setHours(h, m, 0, 0);
      const diff = end.getTime() - now.getTime();
      if (diff <= 0) setCountdown("00:00:00");
      else {
        const hrs = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setCountdown(
          `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
        );
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [task]);

  if (!task) {
    return (
      <Card className="border-blue-500/20 bg-linear-to-br from-gray-800/60 to-gray-800/30">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <TimerIcon size={20} className="text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-blue-400 uppercase tracking-wider">Now</p>
            <p className="text-gray-500 mt-1">No active task</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-blue-500/40 bg-linear-to-br from-blue-600/10 to-gray-800/40">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-blue-500/20">
          <TimerIcon size={20} className="text-blue-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-blue-400 uppercase tracking-wider">Now</p>
          <p className="text-base font-semibold text-gray-100 mt-1">{task.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {task.startTime} – {task.endTime}
          </p>
          <p className="text-2xl font-mono font-semibold text-blue-400 mt-2 tabular-nums">
            {countdown}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge
            variant={
              task.category === "work"
                ? "blue"
                : task.category === "workout"
                  ? "danger"
                  : task.category === "learning"
                    ? "purple"
                    : task.category === "habit"
                      ? "orange"
                      : task.category === "personal"
                        ? "pink"
                        : "default"
            }
          >
            {task.category}
          </Badge>

          {task.category === "workout" && task.referenceId && (
            <Button
              size="sm"
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-500 mt-2 whitespace-nowrap"
              onClick={() =>
                navigate(`/workouts?startSession=${task.referenceId}&taskId=${task.id}`)
              }
            >
              <PlayIcon className="w-4 h-4 mr-1.5" />
              Start Session
            </Button>
          )}

          {task.category === "learning" && task.referenceId && (
            <Button
              size="sm"
              variant="primary"
              className="bg-purple-600 hover:bg-purple-500 mt-2 whitespace-nowrap"
              onClick={() => navigate(`/skills?logSession=${task.referenceId}&taskId=${task.id}`)}
            >
              <GraduationCapIcon className="w-4 h-4 mr-1.5" />
              Log Session
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function NextCard({ task }: { task: Task | null }) {
  if (!task) {
    return (
      <Card className="border-gray-700/50 bg-linear-to-br from-gray-800/60 to-gray-800/30">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-gray-700/50">
            <ArrowRightIcon size={20} className="text-gray-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Next</p>
            <p className="text-gray-500 mt-1">No upcoming tasks</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-gray-600/50 bg-linear-to-br from-gray-800/60 to-gray-800/30">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-gray-700/50">
          <ArrowRightIcon size={20} className="text-gray-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Next</p>
          <p className="text-base font-semibold text-gray-100 mt-1">{task.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">Starts at {task.startTime}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge
            variant={
              task.category === "work"
                ? "blue"
                : task.category === "workout"
                  ? "danger"
                  : task.category === "learning"
                    ? "purple"
                    : task.category === "habit"
                      ? "orange"
                      : task.category === "personal"
                        ? "pink"
                        : "default"
            }
          >
            {task.category}
          </Badge>
        </div>
      </div>
    </Card>
  );
}

function TaskProgress({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <Card padding="sm">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500">Today's Progress</span>
            <span className="text-xs font-medium text-gray-400">
              {done}/{total} tasks
            </span>
          </div>
          <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <span className="text-xl font-bold text-gray-200 tabular-nums">{pct}%</span>
      </div>
    </Card>
  );
}

function HabitChip({ habit, onToggle }: { habit: HabitWithStreak; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
        habit.loggedToday
          ? "bg-emerald-900/40 border-emerald-700/50 text-emerald-300"
          : "bg-gray-700/50 border-gray-600/50 text-gray-300 hover:bg-gray-700"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${habit.loggedToday ? "bg-emerald-400" : "bg-gray-500"}`}
      />
      {habit.name}
      {habit.currentStreak > 0 && (
        <span className="text-xs text-orange-400">🔥{habit.currentStreak}</span>
      )}
    </button>
  );
}
