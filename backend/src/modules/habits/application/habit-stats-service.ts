import { todayInDhaka } from "../../../shared/timezone.js";
import { currentStreak, isCompleted, longestStreak } from "../domain/rules.js";
import type { HabitAnalyticsData } from "../domain/types.js";
import type { HabitLogRepository } from "../ports/habit-log-repository.js";
import type { HabitRepository } from "../ports/habit-repository.js";

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export class HabitStatsService {
  constructor(
    private readonly habitRepo: HabitRepository,
    private readonly habitLogRepo: HabitLogRepository,
  ) {}

  async getAnalytics(
    habitId: string,
    period: "week" | "month",
    userId = "default",
  ): Promise<HabitAnalyticsData | undefined> {
    const habit = await this.habitRepo.getById(habitId, userId);
    if (!habit) return undefined;

    const today = todayInDhaka();
    const endDateStr = today;

    const end = parseLocalDate(endDateStr);
    const start = new Date(end);
    if (period === "week") {
      start.setUTCDate(start.getUTCDate() - 6);
    } else {
      start.setUTCDate(start.getUTCDate() - 29); // 30 days total
    }

    const startDateStr = formatDate(start);

    const logs = await this.habitLogRepo.getByHabitId(habitId, userId);
    const rawRangeLogs = await this.habitLogRepo.getByDateRange(startDateStr, endDateStr, userId);
    const rangeLogs = rawRangeLogs.filter((l) => l.habitId === habitId);

    // Group logs by date
    const logsByDate = new Map<string, typeof rangeLogs>();
    for (const log of rangeLogs) {
      if (!logsByDate.has(log.date)) logsByDate.set(log.date, []);
      logsByDate.get(log.date)?.push(log);
    }

    // Determine target based on config
    let target = 1;
    if (habit.type === "water" && "dailyGoalMl" in habit.config) {
      target = habit.config.dailyGoalMl;
    } else if (habit.type === "walking" && "dailyGoal" in habit.config) {
      target = habit.config.dailyGoal;
    } else if (habit.type === "timed" && "dailyGoalMinutes" in habit.config) {
      target = habit.config.dailyGoalMinutes;
    } else if (habit.type === "prayer") {
      target = 5;
    }

    const totalDays = period === "week" ? 7 : 30;

    const dailyValues: { date: string; value: number; target: number }[] = [];

    let totalValue = 0;
    let completedDays = 0;

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      const dStr = formatDate(d);

      const dayLogs = logsByDate.get(dStr) || [];

      let dayValue = dayLogs.reduce((sum, l) => sum + l.value, 0);
      if (habit.type === "prayer") dayValue = dayLogs.length;
      if (habit.type === "boolean") dayValue = dayLogs.length > 0 ? 1 : 0;

      if (isCompleted(habit, dayLogs)) {
        completedDays++;
      }

      totalValue += dayValue;

      dailyValues.push({
        date: dStr,
        value: dayValue,
        target,
      });
    }

    // completionRate returned as percentage (0-100) for frontend components
    const completionRate = Math.round((completedDays / totalDays) * 100);
    const averageValue = Math.round((totalValue / totalDays) * 10) / 10;

    return {
      habitId,
      period,
      dailyValues,
      completionRate,
      currentStreak: currentStreak(habit, logs, today),
      longestStreak: longestStreak(habit, logs),
      totalValue,
      averageValue,
    };
  }
}
