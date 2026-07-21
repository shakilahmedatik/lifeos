import { currentStreak, longestStreak } from "../domain/rules.js";
import type { HabitStats } from "../domain/types.js";
import type { HabitLogRepository } from "../ports/habit-log-repository.js";
import type { HabitRepository } from "../ports/habit-repository.js";

export class HabitStatsService {
  constructor(
    private readonly habitRepo: HabitRepository,
    private readonly habitLogRepo: HabitLogRepository,
  ) {}

  getHabitStats(habitId: string, startDate: string, endDate: string): HabitStats | undefined {
    const habit = this.habitRepo.getById(habitId);
    if (!habit) return undefined;

    const logs = this.habitLogRepo.getByHabitId(habitId);
    const rangeLogs = this.habitLogRepo.getByDateRange(startDate, endDate);

    const today = new Date().toISOString().split("T")[0];
    const completionCount = rangeLogs.filter((l) => l.habitId === habitId).length;

    const totalDays = this.calculateDaysInRange(startDate, endDate);
    const completionRate = totalDays > 0 ? completionCount / totalDays : 0;

    return {
      habitId,
      completionRate,
      currentStreak: currentStreak(habit, logs, today),
      longestStreak: longestStreak(habit, logs),
      totalCompletions: logs.length,
    };
  }

  private calculateDaysInRange(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
}
