import type { HabitWithStreak } from "@lifeos/contracts";
import { Check, ChevronLeft, ChevronRight, Plus, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DashboardPanel } from "../components/DashboardPanel.js";

interface HabitCarouselWidgetProps {
  habits: HabitWithStreak[];
  onLog: (habitId: string, value: number, meta?: string) => void;
  onUnlog?: (logId: string) => void;
}

export function HabitCarouselWidget({ habits, onLog, onUnlog }: HabitCarouselWidgetProps) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (habits.length > 1) {
      timerRef.current = setInterval(() => {
        setIndex((i) => (i + 1) % habits.length);
      }, 30000);
    }
  }, [habits.length]);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);

  const goTo = (target: number) => {
    if (habits.length === 0) return;
    setIndex((target + habits.length) % habits.length);
    resetTimer();
  };

  if (habits.length === 0) {
    return (
      <DashboardPanel title="Habit Log" subtitle="streaks">
        <div className="flex-1 flex items-center justify-center text-center text-muted text-xs">
          No active habits due today
        </div>
      </DashboardPanel>
    );
  }

  const habit = habits[index % habits.length];
  const pct = Math.min(100, Math.round((habit.todayProgress || 0) * 100));

  const val = habit.todayValue ?? 0;
  const tgt = habit.todayTarget ?? 1;
  const habitLogs = (habit as unknown as { logs?: Array<{ id: string }> }).logs || [];
  const lastLog = habitLogs.length > 0 ? habitLogs[habitLogs.length - 1] : null;

  return (
    <DashboardPanel title="Habit Log" subtitle="streaks">
      <div className="flex flex-col items-center justify-between h-full min-h-42.5">
        {/* Card stack wrapper */}
        <div className="relative w-full flex-1 flex items-center justify-center min-h-37.5">
          {/* Peek cards behind */}
          <div className="absolute w-[86%] h-[82%] rounded-xl bg-gray-900/40 border border-gray-700/30 translate-y-2 scale-[0.95] pointer-events-none" />
          <div className="absolute w-[92%] h-[88%] rounded-xl bg-gray-900/60 border border-gray-700/40 translate-y-1 scale-[0.975] pointer-events-none" />

          {/* Active front card */}
          <div className="relative w-full h-[94%] rounded-xl bg-gray-900/90 border border-gray-700/60 flex flex-col items-center justify-between p-3 shadow-lg">
            {/* Header info */}
            <div className="w-full flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-100 truncate max-w-35">
                {habit.name}
              </span>
              {habit.currentStreak > 0 && (
                <span className="text-[11px] font-mono text-orange-400 font-medium">
                  🔥{habit.currentStreak}d
                </span>
              )}
            </div>

            {/* Value display */}
            <div className="text-center my-0.5">
              <div className="font-mono text-xs font-semibold text-accent">
                {habit.type === "water"
                  ? `${val} / ${tgt} ml`
                  : habit.type === "walking"
                    ? `${val} / ${tgt} ${"unit" in habit.config ? habit.config.unit : "steps"}`
                    : habit.type === "timed"
                      ? `${val} / ${tgt} min`
                      : habit.type === "prayer"
                        ? `${val} / ${tgt} prayers`
                        : habit.loggedToday
                          ? "Completed ✓"
                          : "Not completed"}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-border/60 rounded-full overflow-hidden my-1">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  habit.loggedToday ? "bg-emerald-400" : "bg-accent"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Actionable control buttons per habit type */}
            <div className="w-full mt-1 flex items-center justify-center gap-1.5">
              {habit.type === "water" && (
                <>
                  <button
                    type="button"
                    onClick={() => onLog(habit.id, 250)}
                    className="flex items-center gap-1 text-[11px] font-mono bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800/50 px-2 py-0.5 rounded-lg transition-all"
                  >
                    <Plus size={11} /> +250ml
                  </button>
                  <button
                    type="button"
                    onClick={() => onLog(habit.id, 500)}
                    className="flex items-center gap-1 text-[11px] font-mono bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800/50 px-2 py-0.5 rounded-lg transition-all"
                  >
                    <Plus size={11} /> +500ml
                  </button>
                </>
              )}

              {habit.type === "boolean" && (
                <button
                  type="button"
                  onClick={() => onLog(habit.id, 1)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-lg transition-all border ${
                    habit.loggedToday
                      ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/60"
                      : "bg-accent/15 hover:bg-accent/30 text-accent border-accent/40"
                  }`}
                >
                  <Check size={12} />
                  {habit.loggedToday ? "Done ✓" : "Mark Done"}
                </button>
              )}

              {habit.type === "walking" && (
                <button
                  type="button"
                  onClick={() => onLog(habit.id, 1000)}
                  className="flex items-center gap-1 text-xs font-mono bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/50 px-2.5 py-0.5 rounded-lg transition-all"
                >
                  <Plus size={11} /> +1,000 steps
                </button>
              )}

              {habit.type === "timed" && (
                <button
                  type="button"
                  onClick={() => onLog(habit.id, 15)}
                  className="flex items-center gap-1 text-xs font-mono bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-800/50 px-2.5 py-0.5 rounded-lg transition-all"
                >
                  <Plus size={11} /> +15 mins
                </button>
              )}

              {habit.type === "prayer" && (
                <button
                  type="button"
                  onClick={() => onLog(habit.id, 1)}
                  className="flex items-center gap-1 text-xs font-mono bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/50 px-2.5 py-0.5 rounded-lg transition-all"
                >
                  <Plus size={11} /> Log Prayer (+1)
                </button>
              )}

              {lastLog && onUnlog && (
                <button
                  type="button"
                  onClick={() => onUnlog(lastLog.id)}
                  title="Undo last log"
                  className="flex items-center justify-center text-xs text-gray-400 hover:text-red-300 bg-gray-800/60 hover:bg-red-950/60 border border-gray-700/60 p-1 rounded-lg transition-all"
                >
                  <RotateCcw size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Carousel Footer controls */}
        <div className="flex items-center justify-between w-full mt-1.5 px-1 shrink-0">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            className="p-1 text-muted hover:text-primary transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex gap-1.5">
            {habits.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === (index % habits.length) ? "bg-accent w-3" : "bg-border"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            className="p-1 text-muted hover:text-primary transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </DashboardPanel>
  );
}
