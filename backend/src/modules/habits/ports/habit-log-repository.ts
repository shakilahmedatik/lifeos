import type { HabitLogEntry, NewHabitLogEntryInput } from "../domain/types.js";

export interface HabitLogRepository {
  getById(id: string, userId: string): HabitLogEntry | undefined;
  getByHabitAndDate(habitId: string, date: string, userId: string): HabitLogEntry[];
  getByDateRange(startDate: string, endDate: string, userId: string): HabitLogEntry[];
  getByHabitId(habitId: string, userId: string): HabitLogEntry[];
  getAllLogs(userId: string): HabitLogEntry[];
  create(id: string, input: NewHabitLogEntryInput, userId: string): HabitLogEntry;
  delete(id: string, userId: string): boolean;
  deleteByHabitId(habitId: string, userId: string): void;
}
