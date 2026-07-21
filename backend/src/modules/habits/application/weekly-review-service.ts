import type { DailyCompletion, WeeklyHabitSummary, WeeklySummary } from "../domain/types.js";
import type { HabitLogRepository } from "../ports/habit-log-repository.js";
import type { HabitRepository } from "../ports/habit-repository.js";

export class WeeklyReviewService {
  constructor(
    private readonly habitRepo: HabitRepository,
    private readonly habitLogRepo: HabitLogRepository,
  ) {}

  getWeeklySummary(weekStart: string): WeeklySummary {
    const weekEnd = this.getWeekEnd(weekStart);
    const habits = this.habitRepo.getAll();
    const weekLogs = this.habitLogRepo.getByDateRange(weekStart, weekEnd);

    const habitsSummary: WeeklyHabitSummary[] = habits.map((habit) => {
      const habitLogs = weekLogs.filter((l) => l.habitId === habit.id);
      const targetCount = habit.frequency === "daily" ? 7 : 1;
      const completionCount = habitLogs.length;
      const completionRate = targetCount > 0 ? completionCount / targetCount : 0;

      return {
        habitId: habit.id,
        name: habit.name,
        category: habit.category,
        completionCount,
        targetCount,
        completionRate,
      };
    });

    const dailyBreakdown: DailyCompletion[] = [];
    const startDate = new Date(weekStart);
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      const dayLogs = weekLogs.filter((l) => l.date === dateStr);
      dailyBreakdown.push({
        date: dateStr,
        completions: dayLogs.length,
      });
    }

    const topHabits = [...habitsSummary]
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 3);

    const totalPossible = habitsSummary.reduce((sum, h) => sum + h.targetCount, 0);
    const totalCompleted = habitsSummary.reduce((sum, h) => sum + h.completionCount, 0);
    const overallCompletionRate = totalPossible > 0 ? totalCompleted / totalPossible : 0;

    return {
      habits: habitsSummary,
      dailyBreakdown,
      topHabits,
      overallCompletionRate,
    };
  }

  private getWeekEnd(weekStart: string): string {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return end.toISOString().split("T")[0];
  }
}
