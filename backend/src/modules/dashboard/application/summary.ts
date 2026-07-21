import type { Task } from "../../routine/domain/types.js";
import type { DashboardDependencies } from "../ports/dashboard-dependencies.js";

export interface DashboardSummary {
  now: Task | null;
  next: Task | null;
  todayCount: number;
  todayDoneCount: number;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function getNowAndNext(
  tasks: Task[],
  nowIso: string,
): { now: Task | null; next: Task | null } {
  const now = new Date(nowIso);
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const currentMinutes = timeToMinutes(currentTime);

  let nowTask: Task | null = null;
  let nextTask: Task | null = null;

  for (const task of tasks) {
    const start = timeToMinutes(task.startTime);
    const end = timeToMinutes(task.endTime);

    if (currentMinutes >= start && currentMinutes < end) {
      nowTask = task;
    } else if (start > currentMinutes && !nextTask) {
      nextTask = task;
    }
  }

  return { now: nowTask, next: nextTask };
}

export function getDashboardSummary(deps: DashboardDependencies, nowIso: string): DashboardSummary {
  const today = nowIso.slice(0, 10);
  const tasks = deps.taskRepo.getByDate(today);
  const { now, next } = getNowAndNext(tasks, nowIso);

  return {
    now,
    next,
    todayCount: tasks.length,
    todayDoneCount: tasks.filter((t) => t.status === "done").length,
  };
}
