import { randomUUID } from "node:crypto";

import { currentStreak, isDueToday, longestStreak } from "../domain/rules.js";
import type { HabitLog, HabitWithStreak, NewHabitLogInput } from "../domain/types.js";
import type { HabitLogRepository } from "../ports/habit-log-repository.js";
import type { HabitRepository } from "../ports/habit-repository.js";

export class HabitLogService {
  constructor(
    private readonly habitRepo: HabitRepository,
    private readonly habitLogRepo: HabitLogRepository,
  ) {}

  logHabit(input: NewHabitLogInput): HabitLog {
    const existing = this.habitLogRepo.getByHabitAndDate(input.habitId, input.date);
    if (existing) {
      return existing;
    }

    const id = randomUUID();
    return this.habitLogRepo.create(id, input);
  }

  unlogHabit(habitId: string, date: string): boolean {
    const log = this.habitLogRepo.getByHabitAndDate(habitId, date);
    if (!log) return false;

    return this.habitLogRepo.delete(log.id);
  }

  getTodayDueHabits(today: string): HabitWithStreak[] {
    const habits = this.habitRepo.getAll();
    const todayLogs = this.habitLogRepo.getByDateRange(today, today);

    return habits
      .filter((h) => isDueToday(h, today))
      .map((habit) => {
        const logs = this.habitLogRepo.getByHabitId(habit.id);
        const loggedToday = todayLogs.some((l) => l.habitId === habit.id);

        return {
          ...habit,
          currentStreak: currentStreak(habit, logs, today),
          longestStreak: longestStreak(habit, logs),
          loggedToday,
        };
      })
      .slice(0, 8);
  }

  batchLogHabits(habitIds: string[], date: string): HabitLog[] {
    return habitIds.map((habitId) => this.logHabit({ habitId, date }));
  }

  deleteLogsByHabitId(habitId: string): void {
    this.habitLogRepo.deleteByHabitId(habitId);
  }
}
