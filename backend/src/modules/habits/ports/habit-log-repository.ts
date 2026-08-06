import type { HabitLogEntry, NewHabitLogEntryInput } from "../domain/types.js";

export interface HabitLogRepository {
  getById(id: string, userId: string): Promise<HabitLogEntry | undefined>;
  getByHabitAndDate(habitId: string, date: string, userId: string): Promise<HabitLogEntry[]>;
  getByDateRange(startDate: string, endDate: string, userId: string): Promise<HabitLogEntry[]>;
  getByHabitId(habitId: string, userId: string): Promise<HabitLogEntry[]>;
  getAllLogs(userId: string): Promise<HabitLogEntry[]>;
  create(id: string, input: NewHabitLogEntryInput, userId: string): Promise<HabitLogEntry>;
  delete(id: string, userId: string): Promise<boolean>;
  deleteByHabitId(habitId: string, userId: string): Promise<void>;
}
