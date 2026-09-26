import type { Task } from "@lifeos/contracts";
import { useEffect, useState } from "react";
import Card from "../../components/ui/Card.js";
import TaskCategoryBadge, { CATEGORY_COLORS } from "./TaskCategoryBadge.js";
import { computeDurationMins } from "./TaskList.js";

interface TaskTimelineViewProps {
  tasks: Task[];
  selectedDate: string;
  todayDate: string;
  onViewTask: (task: Task) => void;
}

export default function TaskTimelineView({
  tasks,
  selectedDate,
  todayDate,
  onViewTask,
}: TaskTimelineViewProps) {
  const [currentMinutes, setCurrentMinutes] = useState<number>(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const d = new Date();
      setCurrentMinutes(d.getHours() * 60 + d.getMinutes());
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const isToday = selectedDate === todayDate;

  return (
    <Card padding="md" className="overflow-hidden">
      <div className="flex items-center justify-between mb-3 border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-bold text-primary">24-Hour Timeline View</h3>
          <p className="text-xs text-secondary">
            Scroll vertically to inspect time slots. Click any block to view full details.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
          {tasks.length} task(s)
        </span>
      </div>

      {/* Scrollable Timeline Grid Container */}
      <div className="relative h-170 overflow-y-auto bg-surface rounded-xl border border-border p-2 scrollbar-thin">
        <div className="relative h-360 w-full min-w-125">
          {/* Hour Grid Rows (60px per hour) */}
          {hours.map((hour) => {
            const topPx = hour * 60;
            return (
              <div
                key={hour}
                className="absolute left-0 right-0 border-t border-border flex items-start"
                style={{ top: `${topPx}px`, height: "60px" }}
              >
                <div className="w-14 text-right pr-3 select-none">
                  <span className="text-xs text-secondary font-mono font-medium">
                    {String(hour).padStart(2, "0")}:00
                  </span>
                </div>
                <div className="flex-1 h-full border-l border-border/60" />
              </div>
            );
          })}

          {/* Current Time Red Indicator Line */}
          {isToday && (
            <div
              className="absolute left-14 right-0 z-30 border-t-2 border-red-500 flex items-center pointer-events-none"
              style={{ top: `${(currentMinutes / 1440) * 1440}px` }}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 shadow-md shadow-red-500/80" />
              <span className="text-[10px] font-bold text-white bg-red-600 px-1.5 py-0.5 rounded ml-1 shadow">
                NOW ({Math.floor(currentMinutes / 60)}:
                {String(currentMinutes % 60).padStart(2, "0")})
              </span>
            </div>
          )}

          {/* Task Blocks Container */}
          <div className="absolute left-16 right-2 top-0 bottom-0">
            {tasks.map((task) => {
              const [sH, sM] = task.startTime.split(":").map(Number);
              const startMins = sH * 60 + sM;
              const duration = computeDurationMins(task.startTime, task.endTime);

              const topPx = startMins; // 1px = 1min because total height is 1440px!
              const heightPx = Math.max(duration, 38); // Minimum 38px height so text is always clear & legible!

              const catStyle = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.general;
              const subtaskCount = task.subtasks?.length ?? 0;
              const completedCount = task.subtasks?.filter((s) => s.completed).length ?? 0;

              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => onViewTask(task)}
                  style={{
                    top: `${topPx}px`,
                    height: `${heightPx}px`,
                  }}
                  className={`absolute left-0 right-0 z-10 rounded-xl p-2.5 text-left border-l-4 ${catStyle.borderLeft} bg-card-solid/90 border ${catStyle.border} shadow-md hover:bg-card-hover/90 hover:ring-2 hover:ring-blue-500/60 transition-all overflow-hidden flex flex-col justify-between cursor-pointer`}
                >
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-xs font-bold text-primary truncate">{task.title}</span>
                    <TaskCategoryBadge
                      category={task.category}
                      className="text-[10px] py-0 shrink-0"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-primary font-mono mt-1 flex-wrap">
                    <span>
                      {task.startTime} – {task.endTime} ({duration}m)
                    </span>
                    {subtaskCount > 0 && (
                      <span className="text-[10px] text-purple-300 bg-purple-500/20 px-1.5 py-0.2 rounded">
                        ☑️ {completedCount}/{subtaskCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
