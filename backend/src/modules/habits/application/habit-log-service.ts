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

  async logHabit(input: NewHabitLogEntryInput, userId = "default"): Promise<HabitLogEntry> {
    const id = randomUUID();
    return await this.habitLogRepo.create(id, input, userId);
  }

  async removeLog(logId: string, userId = "default"): Promise<boolean> {
    return await this.habitLogRepo.delete(logId, userId);
  }

  async getLogsForHabitAndDate(
    habitId: string,
    date: string,
    userId = "default",
  ): Promise<HabitLogEntry[]> {
    return await this.habitLogRepo.getByHabitAndDate(habitId, date, userId);
  }

  async getTodayDueHabits(today: string, userId = "default"): Promise<HabitWithStreak[]> {
    const habits = await this.habitRepo.getAll(false, userId);
    const todayLogs = await this.habitLogRepo.getByDateRange(today, today, userId);

    const results: HabitWithStreak[] = [];

    for (const habit of habits) {
      if (!isDueToday(habit, today)) continue;

      const logs = await this.habitLogRepo.getByHabitId(habit.id, userId);
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

      results.push({
        ...habit,
        currentStreak: cStreak,
        longestStreak: lStreak,
        loggedToday: progress >= 1,
        todayProgress: progress,
        todayValue,
        todayTarget,
      });
    }

    return results;
  }

  async deleteLogsByHabitId(habitId: string, userId = "default"): Promise<void> {
    await this.habitLogRepo.deleteByHabitId(habitId, userId);
  }
}
