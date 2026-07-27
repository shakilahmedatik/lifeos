import type { Task } from "./types.js";

export function isOvernightTask(startTime: string, endTime: string): boolean {
  return timeToMinutes(startTime) > timeToMinutes(endTime);
}

export function durationMinutes(task: { startTime: string; endTime: string }): number {
  const start = timeToMinutes(task.startTime);
  const end = timeToMinutes(task.endTime);

  if (start < end) {
    return end - start;
  }
  // Overnight task (e.g. 23:00 to 02:00 -> (1440 - 1380) + 120 = 180 mins)
  return 1440 - start + end;
}

export function tasksOverlap(a: Task, b: Task): boolean {
  const aOvernight = isOvernightTask(a.startTime, a.endTime);
  const bOvernight = isOvernightTask(b.startTime, b.endTime);

  // Same date comparison
  if (a.date === b.date) {
    const aStart = timeToMinutes(a.startTime);
    const aEnd = aOvernight ? 1440 : timeToMinutes(a.endTime);
    const bStart = timeToMinutes(b.startTime);
    const bEnd = bOvernight ? 1440 : timeToMinutes(b.endTime);

    return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
  }

  // Cross-midnight comparison: A is day before B
  const dateDiff = getDateDiffDays(a.date, b.date);
  if (dateDiff === 1 && aOvernight) {
    // A spills into B's date from 00:00 to aEnd
    const aSpillEnd = timeToMinutes(a.endTime);
    const bStart = timeToMinutes(b.startTime);
    return bStart < aSpillEnd;
  }

  if (dateDiff === -1 && bOvernight) {
    // B spills into A's date from 00:00 to bEnd
    const bSpillEnd = timeToMinutes(b.endTime);
    const aStart = timeToMinutes(a.startTime);
    return aStart < bSpillEnd;
  }

  return false;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function getDateDiffDays(dateStrA: string, dateStrB: string): number {
  const dtA = new Date(`${dateStrA}T00:00:00Z`).getTime();
  const dtB = new Date(`${dateStrB}T00:00:00Z`).getTime();
  return Math.round((dtB - dtA) / (1000 * 60 * 60 * 24));
}
