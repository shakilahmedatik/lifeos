import type { Task } from "@lifeos/contracts";
import { GraduationCap, Play } from "lucide-react";
import { useEffect, useState } from "react";
import Badge from "../../../components/ui/Badge.js";
import Button from "../../../components/ui/Button.js";
import { DashboardPanel } from "../components/DashboardPanel.js";

interface ScheduleWidgetProps {
  previous: Task | null;
  now: Task | null;
  next: Task | null;
  onNavigate: (path: string) => void;
}

export function ScheduleWidget({ previous, now, next, onNavigate }: ScheduleWidgetProps) {
  const [countdown, setCountdown] = useState("");

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

  return (
    <DashboardPanel title="Schedule" subtitle="routine">
      <div className="flex flex-col gap-2 justify-between h-full py-0.5">
        {/* Previous Card */}
        <div className="rounded-lg border border-border bg-surface px-3 py-1.5 opacity-60 flex items-center justify-between shrink-0">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-muted">
              Previous
            </div>
            <div className="text-xs text-secondary line-through truncate max-w-[220px]">
              {previous ? previous.title : "No previous task"}
            </div>
          </div>
          {previous && (
            <div className="font-mono text-[10px] text-muted">
              {previous.startTime} – {previous.endTime}
            </div>
          )}
        </div>

        {/* Now Card */}
        <div className="rounded-lg border-l-3 border-accent border border-border bg-surface px-3 py-2 flex-1 flex flex-col justify-between shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="font-mono text-[9.5px] uppercase tracking-widest text-accent font-semibold">
                Now
              </span>
            </div>
            {now && (
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
            )}
          </div>

          <div>
            <div className="text-sm font-semibold text-primary truncate">
              {now ? now.title : "No active task"}
            </div>
            {now && (
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono text-[10.5px] text-muted">
                  {now.startTime} – {now.endTime}
                </span>
                <span className="font-mono text-xs font-semibold text-accent tabular-nums">
                  {countdown}
                </span>
              </div>
            )}
          </div>

          {/* Action buttons if applicable */}
          {now?.category === "workout" && now.referenceId && (
            <div className="mt-1">
              <Button
                size="sm"
                variant="primary"
                className="w-full bg-emerald-600 hover:bg-emerald-500 py-1 text-xs"
                onClick={() =>
                  onNavigate(`/workouts?startSession=${now.referenceId}&taskId=${now.id}`)
                }
              >
                <Play className="w-3.5 h-3.5 mr-1" />
                Start Session
              </Button>
            </div>
          )}

          {now?.category === "learning" && now.referenceId && (
            <div className="mt-1">
              <Button
                size="sm"
                variant="primary"
                className="w-full bg-purple-600 hover:bg-purple-500 py-1 text-xs"
                onClick={() => onNavigate(`/skills?logSession=${now.referenceId}&taskId=${now.id}`)}
              >
                <GraduationCap className="w-3.5 h-3.5 mr-1" />
                Log Session
              </Button>
            </div>
          )}
        </div>

        {/* Next Card */}
        <div className="rounded-lg border border-border bg-surface px-3 py-1.5 opacity-80 flex items-center justify-between shrink-0">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-muted">Next</div>
            <div className="text-xs font-medium text-primary truncate max-w-[220px]">
              {next ? next.title : "No upcoming tasks"}
            </div>
          </div>
          {next && <div className="font-mono text-[10px] text-muted">{next.startTime}</div>}
        </div>
      </div>
    </DashboardPanel>
  );
}
