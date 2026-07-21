import type { HabitLog, NewHabitLogInput } from "../domain/types.js";

export interface HabitLogRepository {
  getById(id: string): HabitLog | undefined;
  getByHabitAndDate(habitId: string, date: string): HabitLog | undefined;
  getByDateRange(startDate: string, endDate: string): HabitLog[];
  getByHabitId(habitId: string): HabitLog[];
  create(id: string, input: NewHabitLogInput): HabitLog;
  delete(id: string): boolean;
  deleteByHabitId(habitId: string): void;
}
