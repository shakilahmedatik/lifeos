import { randomUUID } from "node:crypto";

import { currentStreak, getDailyProgress, isDueToday, longestStreak } from "../domain/rules.js";
import type { HabitLogEntry, HabitWithStreak, NewHabitLogEntryInput } from "../domain/types.js";
import type { HabitLogRepository } from "../ports/habit-log-repository.js";
import type { HabitRepository } from "../ports/habit-repository.js";

export class HabitLogService {
  constructor(
    private readonly habitRepo: HabitRepository,
    private readonly habitLogRepo: HabitLogRepository,
  ) {}

  logHabit(input: NewHabitLogEntryInput): HabitLogEntry {
    const id = randomUUID();
    return this.habitLogRepo.create(id, input);
  }

  removeLog(logId: string): boolean {
    return this.habitLogRepo.delete(logId);
  }

  getLogsForHabitAndDate(habitId: string, date: string): HabitLogEntry[] {
    return this.habitLogRepo.getByHabitAndDate(habitId, date);
  }

  getTodayDueHabits(today: string): HabitWithStreak[] {
    const habits = this.habitRepo.getAll(false);
    const todayLogs = this.habitLogRepo.getByDateRange(today, today);

    return habits
      .filter((h) => isDueToday(h, today))
      .map((habit) => {
        const logs = this.habitLogRepo.getByHabitId(habit.id);
        const habitTodayLogs = todayLogs.filter((l) => l.habitId === habit.id);

        const progress = getDailyProgress(habit, habitTodayLogs);

        let todayValue = habitTodayLogs.reduce((sum, l) => sum + l.value, 0);
        if (habit.type === "prayer") {
          todayValue = habitTodayLogs.length;
        } else if (habit.type === "boolean") {
          todayValue = habitTodayLogs.length > 0 ? 1 : 0;
        }

        let todayTarget = 1;
        if (habit.type === "water" && "dailyGoalMl" in habit.config) {
          todayTarget = habit.config.dailyGoalMl;
        } else if (habit.type === "walking" && "dailyGoal" in habit.config) {
          todayTarget = habit.config.dailyGoal;
        } else if (habit.type === "timed" && "dailyGoalMinutes" in habit.config) {
          todayTarget = habit.config.dailyGoalMinutes;
        } else if (habit.type === "prayer") {
          todayTarget = 5;
        }

        const cStreak = currentStreak(habit, logs, today);
        const lStreak = longestStreak(habit, logs);

        return {
          habit,
          date: today,
          currentValue: todayValue,
          targetValue: todayTarget,
          progress,
          logs: habitTodayLogs,
          currentStreak: cStreak,
          longestStreak: lStreak,
          // Backward compat aliases for HabitWithStreak
          ...habit,
          loggedToday: progress >= 1,
          todayProgress: progress,
          todayValue,
          todayTarget,
        };
      });
  }

  deleteLogsByHabitId(habitId: string): void {
    this.habitLogRepo.deleteByHabitId(habitId);
  }
}
