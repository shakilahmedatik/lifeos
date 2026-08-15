import type { Task } from "@lifeos/contracts";
import { Check, Clock, GraduationCap, Play, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import Badge from "../../../components/ui/Badge.js";
import { DashboardPanel } from "../components/DashboardPanel.js";

interface ScheduleWidgetProps {
  previous: Task | null;
  now: Task | null;
  next: Task | null;
  onNavigate: (path: string) => void;
  onStartTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
}

function getCategoryVariant(category: string): "blue" | "danger" | "purple" | "orange" | "default" {
  switch (category) {
    case "work":
      return "blue";
    case "workout":
      return "danger";
    case "learning":
      return "purple";
    case "habit":
      return "orange";
    default:
      return "default";
  }
}

export function ScheduleWidget({
  previous,
  now,
  next,
  onNavigate,
  onStartTask,
  onCompleteTask,
}: ScheduleWidgetProps) {
  const [countdown, setCountdown] = useState("");
  const [nextCountdown, setNextCountdown] = useState("");

  // Countdown for active 'now' task
  useEffect(() => {
    if (!now) return;
    const tick = () => {
      const currentTime = new Date();
      const [sh] = now.startTime.split(":").map(Number);
      const [h, m] = now.endTime.split(":").map(Number);
      const end = new Date(currentTime);
      end.setHours(h, m, 0, 0);
      if ((now.isOvernight || sh > h) && currentTime.getHours() >= sh) {
        end.setDate(end.getDate() + 1);
      }
      const diff = end.getTime() - currentTime.getTime();
      if (diff <= 0) {
        setCountdown("00:00:00");
      } else {
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
  }, [now]);

  // Countdown for 'next' task start time when 'now' is not active
  useEffect(() => {
    if (now || !next) return;
    const tick = () => {
      const currentTime = new Date();
      const [h, m] = next.startTime.split(":").map(Number);
      const start = new Date(currentTime);
      start.setHours(h, m, 0, 0);
      if (start.getTime() < currentTime.getTime()) {
        start.setDate(start.getDate() + 1);
      }
      const diff = start.getTime() - currentTime.getTime();
      if (diff <= 0) {
        setNextCountdown("Starting now");
      } else {
        const hrs = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setNextCountdown(
          `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
        );
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [now, next]);

  return (
    <DashboardPanel title="Schedule" subtitle="routine">
      <div className="flex flex-col gap-1.5 sm:gap-2 justify-between h-full py-0.5 overflow-hidden">
        {/* Previous Card */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigate("/routine")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onNavigate("/routine");
          }}
          className="rounded-lg border border-border/80 bg-surface/70 px-2.5 py-1.5 flex items-center justify-between shrink-0 transition-colors hover:border-border-hover hover:bg-card-hover cursor-pointer group"
          title={
            previous
              ? `Previous task: ${previous.title} (${previous.startTime} - ${previous.endTime})`
              : "View routine schedule"
          }
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted font-medium shrink-0">
              Prev
            </span>
            {previous ? (
              <span
                className={`text-xs truncate max-w-48 sm:max-w-64 ${
                  previous.status === "done" || previous.status === "skipped"
                    ? "line-through text-muted"
                    : "text-primary font-medium"
                }`}
              >
                {previous.title}
              </span>
            ) : (
              <span className="text-xs text-secondary italic">No previous task for today</span>
            )}
          </div>

          {previous ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-mono text-[10px] text-muted hidden sm:inline">
                {previous.startTime} – {previous.endTime}
              </span>
              <Badge size="sm" variant={getCategoryVariant(previous.category)}>
                {previous.category}
              </Badge>
              {previous.status === "done" && (
                <span className="text-[8.5px] uppercase font-semibold px-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  Done
                </span>
              )}
            </div>
          ) : (
            <span className="font-mono text-[10px] text-muted">—</span>
          )}
        </div>

        {/* Now Card */}
        <div className="rounded-lg border border-accent/40 bg-surface px-3 py-2 flex-1 flex flex-col justify-between shadow-xs min-h-0">
          <div className="flex items-center justify-between shrink-0 gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${now ? (now.status === "in_progress" ? "bg-amber-400 animate-ping" : "bg-accent animate-pulse") : "bg-muted"}`}
              />
              <span className="font-mono text-[9.5px] uppercase tracking-widest text-accent font-bold">
                Now
              </span>
            </div>

            {now ? (
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Compact Icon Actions Before Status */}
                {now.category === "workout" && now.referenceId && (
                  <button
                    type="button"
                    onClick={() =>
                      onNavigate(`/workouts?startSession=${now.referenceId}&taskId=${now.id}`)
                    }
                    className="p-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition-colors"
                    title="Start Workout"
                  >
                    <Play size={12} className="fill-current" />
                  </button>
                )}

                {now.category === "learning" && now.referenceId && (
                  <button
                    type="button"
                    onClick={() =>
                      onNavigate(`/skills?logSession=${now.referenceId}&taskId=${now.id}`)
                    }
                    className="p-1 rounded-md bg-purple-500/15 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 transition-colors"
                    title="Log Skill"
                  >
                    <GraduationCap size={12} />
                  </button>
                )}

                {onStartTask && now.status !== "in_progress" && now.status !== "done" && (
                  <button
                    type="button"
                    onClick={() => onStartTask(now.id)}
                    className="p-1 rounded-md bg-accent/20 hover:bg-accent/40 text-accent border border-accent/40 transition-colors"
                    title="Set In Progress"
                  >
                    <Play size={12} className="fill-current" />
                  </button>
                )}

                {onCompleteTask && now.status !== "done" && (
                  <button
                    type="button"
                    onClick={() => onCompleteTask(now.id)}
                    className="p-1 rounded-md bg-surface-elevated hover:bg-emerald-500/20 text-muted hover:text-emerald-400 border border-border hover:border-emerald-500/30 transition-colors"
                    title="Mark Done"
                  >
                    <Check size={12} strokeWidth={2.5} />
                  </button>
                )}

                {/* Status Badge */}
                {now.status === "in_progress" ? (
                  <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                    In Progress
                  </span>
                ) : now.status === "done" ? (
                  <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Done
                  </span>
                ) : (
                  <span className="text-[9px] uppercase font-medium tracking-wider px-1.5 py-0.5 rounded bg-surface-elevated text-secondary border border-border">
                    {now.status}
                  </span>
                )}

                {/* Category Badge */}
                <Badge size="sm" variant={getCategoryVariant(now.category)}>
                  {now.category}
                </Badge>
              </div>
            ) : next ? (
              <div className="flex items-center gap-1.5 shrink-0">
                {onStartTask && (
                  <button
                    type="button"
                    onClick={() => onStartTask(next.id)}
                    className="p-1 rounded-md bg-accent/15 hover:bg-accent/30 text-accent border border-accent/30 transition-colors"
                    title={`Start "${next.title}" Now`}
                  >
                    <Play size={11} className="fill-current" />
                  </button>
                )}
                <span className="text-[9.5px] font-mono text-secondary">
                  Next at {next.startTime}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate("/routine")}
                className="p-1 rounded-md hover:bg-card-hover text-muted hover:text-primary transition-colors"
                title="Add Daily Routine"
              >
                <Plus size={12} />
              </button>
            )}
          </div>

          <div className="my-auto py-1.5">
            {now ? (
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-sm sm:text-base font-bold text-primary truncate leading-tight">
                    {now.title}
                  </div>
                  <div
                    className="font-mono text-base sm:text-lg font-bold text-accent tabular-nums flex items-center gap-1.5 shrink-0 tracking-tight"
                    title="Time remaining in current block"
                  >
                    <Clock size={14} className="text-accent/80" />
                    {countdown}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-muted">
                  <span>
                    {now.startTime} – {now.endTime}
                  </span>
                  <span className="text-[9.5px] text-muted/70 uppercase tracking-wider">
                    remaining
                  </span>
                </div>
              </div>
            ) : next ? (
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-xs sm:text-sm font-semibold text-primary truncate">
                    <span className="text-muted font-normal mr-1">Up next:</span>
                    {next.title}
                  </div>
                  <div className="font-mono text-xs sm:text-sm font-bold text-amber-400 tabular-nums shrink-0">
                    in {nextCountdown}
                  </div>
                </div>
                <div className="flex items-center justify-between font-mono text-[10.5px] text-muted">
                  <span>
                    Scheduled {next.startTime} – {next.endTime}
                  </span>
                  <span className="text-[9.5px] text-muted/70 uppercase tracking-wider">
                    starts soon
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-secondary py-1 text-center">
                No active tasks scheduled for today
              </div>
            )}
          </div>
        </div>

        {/* Next Card */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigate("/routine")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onNavigate("/routine");
          }}
          className="rounded-lg border border-border/80 bg-surface/70 px-2.5 py-1.5 flex items-center justify-between shrink-0 transition-colors hover:border-border-hover hover:bg-card-hover cursor-pointer group"
          title={next ? `Next task: ${next.title} (${next.startTime})` : "View routine schedule"}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted font-medium shrink-0">
              Next
            </span>
            {next ? (
              <span className="text-xs truncate max-w-48 sm:max-w-64 font-medium text-primary">
                {next.title}
              </span>
            ) : (
              <span className="text-xs text-secondary italic">No upcoming tasks</span>
            )}
          </div>

          {next ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-mono text-[10px] text-muted">{next.startTime}</span>
              <Badge size="sm" variant={getCategoryVariant(next.category)}>
                {next.category}
              </Badge>
            </div>
          ) : (
            <span className="font-mono text-[10px] text-muted">—</span>
          )}
        </div>
      </div>
    </DashboardPanel>
  );
}
