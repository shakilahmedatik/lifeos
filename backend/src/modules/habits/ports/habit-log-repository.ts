import type { HabitLogEntry, NewHabitLogEntryInput } from "../domain/types.js";

export interface HabitLogRepository {
  getById(id: string): HabitLogEntry | undefined;
  getByHabitAndDate(habitId: string, date: string): HabitLogEntry[];
  getByDateRange(startDate: string, endDate: string): HabitLogEntry[];
  getByHabitId(habitId: string): HabitLogEntry[];
  getAllLogs(): HabitLogEntry[];
  create(id: string, input: NewHabitLogEntryInput): HabitLogEntry;
  delete(id: string): boolean;
  deleteByHabitId(habitId: string): void;
}
