import type { Habit, HabitFrequency, HabitLog } from "./types.js";

export function isDueToday(habit: Habit, today: string): boolean {
  if (habit.frequency === "daily") return true;

  const date = new Date(today);
  const dayOfWeek = date.getDay();
  return dayOfWeek === 1;
}

export function currentStreak(habit: Habit, logs: HabitLog[], today: string): number {
  const sortedDates = getSortedLogDates(logs);
  if (sortedDates.length === 0) return 0;

  let streak = 0;
  const currentDate = new Date(today);

  if (habit.frequency === "daily") {
    while (true) {
      const dateStr = formatDate(currentDate);
      if (!sortedDates.includes(dateStr)) break;
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }
  } else {
    const startOfWeek = getWeekStart(currentDate);
    const dateStr = formatDate(startOfWeek);
    if (sortedDates.includes(dateStr)) {
      streak++;
      const prevWeek = new Date(startOfWeek);
      prevWeek.setDate(prevWeek.getDate() - 7);
      while (sortedDates.includes(formatDate(prevWeek))) {
        streak++;
        prevWeek.setDate(prevWeek.getDate() - 7);
      }
    }
  }

  return streak;
}

export function longestStreak(habit: Habit, logs: HabitLog[]): number {
  const sortedDates = getSortedLogDates(logs);
  if (sortedDates.length === 0) return 0;

  let maxStreak = 1;
  let currentStreakCount = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);

    if (habit.frequency === "daily") {
      const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        currentStreakCount++;
        maxStreak = Math.max(maxStreak, currentStreakCount);
      } else {
        currentStreakCount = 1;
      }
    } else {
      const diffWeeks = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24 * 7);
      if (Math.abs(diffWeeks - 1) < 0.1) {
        currentStreakCount++;
        maxStreak = Math.max(maxStreak, currentStreakCount);
      } else {
        currentStreakCount = 1;
      }
    }
  }

  return maxStreak;
}

function getSortedLogDates(logs: HabitLog[]): string[] {
  return logs
    .map((l) => l.date)
    .sort()
    .reverse();
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}
