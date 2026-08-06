import type { HabitDefinition, HabitLogEntry } from "./types.js";

export function getDailyProgress(habit: HabitDefinition, logs: HabitLogEntry[]): number {
  if (logs.length === 0) return 0;

  const totalValue = logs.reduce((sum, log) => sum + log.value, 0);

  switch (habit.type) {
    case "water":
      if ("dailyGoalMl" in habit.config) {
        return Math.min(totalValue / habit.config.dailyGoalMl, 1);
      }
      return 0;
    case "walking":
      if ("dailyGoal" in habit.config) {
        return Math.min(totalValue / habit.config.dailyGoal, 1);
      }
      return 0;
    case "prayer": {
      const prayerCount =
        "prayers" in habit.config &&
        Array.isArray(habit.config.prayers) &&
        habit.config.prayers.length > 0
          ? habit.config.prayers.length
          : 5;
      return Math.min(logs.length / prayerCount, 1);
    }
    case "timed":
      if ("dailyGoalMinutes" in habit.config) {
        return Math.min(totalValue / habit.config.dailyGoalMinutes, 1);
      }
      return 0;
    case "boolean":
      return logs.length > 0 ? 1 : 0;
    default:
      return 0;
  }
}

export function isCompleted(habit: HabitDefinition, logs: HabitLogEntry[]): boolean {
  return getDailyProgress(habit, logs) >= 1;
}

export function isDueToday(_habit: HabitDefinition, _today: string): boolean {
  // Can be expanded later for specific days of week
  return true;
}

function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function getCompletedDates(habit: HabitDefinition, logs: HabitLogEntry[]): Set<string> {
  const logsByDate = new Map<string, HabitLogEntry[]>();
  for (const log of logs) {
    if (!logsByDate.has(log.date)) {
      logsByDate.set(log.date, []);
    }
    logsByDate.get(log.date)?.push(log);
  }

  const completedDates = new Set<string>();
  for (const [date, dateLogs] of logsByDate.entries()) {
    if (isCompleted(habit, dateLogs)) {
      completedDates.add(date);
    }
  }
  return completedDates;
}

export function currentStreak(
  habit: HabitDefinition,
  logs: HabitLogEntry[],
  today: string,
): number {
  if (logs.length === 0) return 0;

  const logDatesSet = getCompletedDates(habit, logs);

  // Assuming all habits are daily for now (since frequency was deprecated or implied)
  // Let's implement daily streak logic.
  let streak = 0;
  const checkDate = parseLocalDate(today);

  const todayStr = formatDate(checkDate);
  if (!logDatesSet.has(todayStr)) {
    checkDate.setUTCDate(checkDate.getUTCDate() - 1);
  }

  while (logDatesSet.has(formatDate(checkDate))) {
    streak++;
    checkDate.setUTCDate(checkDate.getUTCDate() - 1);
  }

  return streak;
}

export function longestStreak(habit: HabitDefinition, logs: HabitLogEntry[]): number {
  if (logs.length === 0) return 0;

  const logDatesSet = getCompletedDates(habit, logs);
  const uniqueSortedDates = Array.from(logDatesSet).sort();
  if (uniqueSortedDates.length === 0) return 0;

  let maxStreak = 1;
  let currentStreakCount = 1;

  for (let i = 1; i < uniqueSortedDates.length; i++) {
    const prev = parseLocalDate(uniqueSortedDates[i - 1]);
    const curr = parseLocalDate(uniqueSortedDates[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreakCount++;
      maxStreak = Math.max(maxStreak, currentStreakCount);
    } else {
      currentStreakCount = 1;
    }
  }

  return maxStreak;
}
