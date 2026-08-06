import { isCompleted } from "../domain/rules.js";
import type { DailyCompletion, WeeklyHabitSummary, WeeklySummary } from "../domain/types.js";
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

export class WeeklyReviewService {
  constructor(
    private readonly habitRepo: HabitRepository,
    private readonly habitLogRepo: HabitLogRepository,
  ) {}

  async getWeeklySummary(weekStart: string, userId = "default"): Promise<WeeklySummary> {
    const weekEnd = this.getWeekEnd(weekStart);
    const habits = await this.habitRepo.getAll(false, userId);
    const weekLogs = await this.habitLogRepo.getByDateRange(weekStart, weekEnd, userId);

    const habitsSummary: WeeklyHabitSummary[] = habits.map((habit) => {
      const habitLogs = weekLogs.filter((l) => l.habitId === habit.id);

      const targetCount = 7;
      let completionCount = 0;

      const startDate = parseLocalDate(weekStart);
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setUTCDate(startDate.getUTCDate() + i);
        const dateStr = formatDate(date);
        const dayLogs = habitLogs.filter((l) => l.date === dateStr);
        if (isCompleted(habit, dayLogs)) {
          completionCount++;
        }
      }

      const completionRate = targetCount > 0 ? completionCount / targetCount : 0;

      return {
        habitId: habit.id,
        name: habit.name,
        type: habit.type,
        category: habit.category,
        completionCount,
        targetCount,
        completionRate,
      };
    });

    const dailyBreakdown: DailyCompletion[] = [];
    const startDate = parseLocalDate(weekStart);
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setUTCDate(startDate.getUTCDate() + i);
      const dateStr = formatDate(date);

      let dayCompletions = 0;
      for (const habit of habits) {
        const dayLogs = weekLogs.filter((l) => l.habitId === habit.id && l.date === dateStr);
        if (isCompleted(habit, dayLogs)) {
          dayCompletions++;
        }
      }

      dailyBreakdown.push({
        date: dateStr,
        completions: dayCompletions,
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
    const start = parseLocalDate(weekStart);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    return formatDate(end);
  }
}
