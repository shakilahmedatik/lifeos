import type { Task } from "./types.js";

export function durationMinutes(task: Task): number {
  const [startH, startM] = task.startTime.split(":").map(Number);
  const [endH, endM] = task.endTime.split(":").map(Number);
  return endH * 60 + endM - (startH * 60 + startM);
}

export function tasksOverlap(a: Task, b: Task): boolean {
  if (a.date !== b.date) return false;

  const aStart = timeToMinutes(a.startTime);
  const aEnd = timeToMinutes(a.endTime);
  const bStart = timeToMinutes(b.startTime);
  const bEnd = timeToMinutes(b.endTime);

  return aStart < bEnd && bStart < aEnd;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
