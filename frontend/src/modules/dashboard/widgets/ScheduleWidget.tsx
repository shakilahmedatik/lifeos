import type { Task } from "@lifeos/contracts";
import { Check, GraduationCap, Play, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import Badge from "../../../components/ui/Badge.js";
import Button from "../../../components/ui/Button.js";
import { DashboardPanel } from "../components/DashboardPanel.js";

interface ScheduleWidgetProps {
  previous: Task | null;
  now: Task | null;
  next: Task | null;
  onNavigate: (path: string) => void;
  onStartTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
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
      <div className="flex flex-col gap-2 justify-between h-full py-0.5">
        {/* Previous Card */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigate("/routine")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onNavigate("/routine");
          }}
          className="rounded-lg border border-border bg-surface px-3 py-2 flex items-center justify-between shrink-0 transition-colors hover:border-border-hover hover:bg-card-hover cursor-pointer"
          title={
            previous
              ? `Previous task: ${previous.title} (${previous.startTime} - ${previous.endTime})`
              : "View routine schedule"
          }
        >
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted font-medium">
                Previous
              </span>
              {previous && (
                <span
                  className={`text-[8.5px] uppercase font-semibold px-1 rounded ${
                    previous.status === "done"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                      : previous.status === "skipped"
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                        : "bg-muted/20 text-muted"
                  }`}
                >
                  {previous.status}
                </span>
              )}
            </div>
            <div
              className={`text-xs truncate max-w-55 ${
                previous
                  ? previous.status === "done" || previous.status === "skipped"
                    ? "line-through text-muted"
                    : "text-primary font-medium"
                  : "text-secondary italic"
              }`}
            >
              {previous ? previous.title : "No previous task for today"}
            </div>
          </div>

          {previous ? (
            <div className="flex flex-col items-end shrink-0 gap-0.5">
              <span className="font-mono text-[10px] text-muted">
                {previous.startTime} – {previous.endTime}
              </span>
              <Badge
                size="sm"
                variant={
                  previous.category === "work"
                    ? "blue"
                    : previous.category === "workout"
                      ? "danger"
                      : previous.category === "learning"
                        ? "purple"
                        : previous.category === "habit"
                          ? "orange"
                          : "default"
                }
              >
                {previous.category}
              </Badge>
            </div>
          ) : (
            <span className="font-mono text-[10px] text-muted">—</span>
          )}
        </div>

        {/* Now Card */}
        <div className="rounded-lg border-l-3 border-accent border bg-surface px-3 py-2 flex-1 flex flex-col justify-between shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${now ? "bg-accent animate-pulse" : "bg-muted"}`}
              />
              <span className="font-mono text-[9.5px] uppercase tracking-widest text-accent font-semibold">
                Now
              </span>
            </div>
            {now ? (
              <div className="flex items-center gap-1.5">
                {now.status === "in_progress" && (
                  <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                    In Progress
                  </span>
                )}
                <Badge
                  variant={
                    now.category === "work"
                      ? "blue"
                      : now.category === "workout"
                        ? "danger"
                        : now.category === "learning"
                          ? "purple"
                          : now.category === "habit"
                            ? "orange"
                            : "default"
                  }
                >
                  {now.category}
                </Badge>
              </div>
            ) : next ? (
              <span className="text-[9.5px] font-mono text-secondary">
                Next at {next.startTime}
              </span>
            ) : null}
          </div>

          <div>
            {now ? (
              <>
                <div className="text-sm font-semibold text-primary truncate">{now.title}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-[10.5px] text-muted">
                    {now.startTime} – {now.endTime}
                  </span>
                  <span
                    className="font-mono text-xs font-semibold text-accent tabular-nums"
                    title="Time remaining in current block"
                  >
                    {countdown}
                  </span>
                </div>
              </>
            ) : next ? (
              <div className="space-y-1">
                <div className="text-xs text-secondary">
                  Free time • Up next:{" "}
                  <span className="font-semibold text-primary">{next.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10.5px] text-muted">
                    Scheduled {next.startTime} – {next.endTime}
                  </span>
                  <span className="font-mono text-xs font-medium text-amber-400 tabular-nums">
                    Starts in {nextCountdown}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-secondary py-0.5">
                No active tasks scheduled for today
              </div>
            )}
          </div>

          {/* Action buttons */}
          {now ? (
            <div className="flex items-center gap-1.5 mt-1">
              {now.category === "workout" && now.referenceId && (
                <Button
                  size="sm"
                  variant="primary"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-1 text-xs"
                  onClick={() =>
                    onNavigate(`/workouts?startSession=${now.referenceId}&taskId=${now.id}`)
                  }
                >
                  <Play className="w-3.5 h-3.5 mr-1" />
                  Start Workout
                </Button>
              )}

              {now.category === "learning" && now.referenceId && (
                <Button
                  size="sm"
                  variant="primary"
                  className="flex-1 bg-purple-600 hover:bg-purple-500 py-1 text-xs"
                  onClick={() =>
                    onNavigate(`/skills?logSession=${now.referenceId}&taskId=${now.id}`)
                  }
                >
                  <GraduationCap className="w-3.5 h-3.5 mr-1" />
                  Log Skill
                </Button>
              )}

              {onCompleteTask && now.status !== "done" && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="py-1 text-xs hover:text-emerald-400"
                  onClick={() => onCompleteTask(now.id)}
                  title="Mark task completed"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Done
                </Button>
              )}
            </div>
          ) : next && onStartTask ? (
            <div className="mt-1">
              <Button
                size="sm"
                variant="secondary"
                className="w-full py-1 text-xs border-accent/30 text-accent hover:bg-accent/10"
                onClick={() => onStartTask(next.id)}
              >
                <Play className="w-3.5 h-3.5 mr-1" />
                Start "{next.title}" Now
              </Button>
            </div>
          ) : (
            <div className="mt-1">
              <Button
                size="sm"
                variant="ghost"
                className="w-full py-1 text-xs text-muted hover:text-primary"
                onClick={() => onNavigate("/routine")}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Daily Routine
              </Button>
            </div>
          )}
        </div>

        {/* Next Card */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigate("/routine")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onNavigate("/routine");
          }}
          className="rounded-lg border border-border bg-surface px-3 py-2 flex items-center justify-between shrink-0 transition-colors hover:border-border-hover hover:bg-card-hover cursor-pointer"
          title={next ? `Next task: ${next.title} (${next.startTime})` : "View routine schedule"}
        >
          <div className="flex-1 min-w-0 pr-2">
            <div className="font-mono text-[9px] uppercase tracking-widest text-muted font-medium mb-0.5">
              Next
            </div>
            <div
              className={`text-xs truncate max-w-55 ${next ? "font-medium text-primary" : "text-secondary italic"}`}
            >
              {next ? next.title : "No upcoming tasks"}
            </div>
          </div>

          {next ? (
            <div className="flex flex-col items-end shrink-0 gap-0.5">
              <span className="font-mono text-[10px] text-muted">{next.startTime}</span>
              <Badge
                size="sm"
                variant={
                  next.category === "work"
                    ? "blue"
                    : next.category === "workout"
                      ? "danger"
                      : next.category === "learning"
                        ? "purple"
                        : next.category === "habit"
                          ? "orange"
                          : "default"
                }
              >
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
