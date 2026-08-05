import type { NewReminderInput, Reminder, UpdateReminderInput } from "../domain/types.js";

export interface ReminderRepository {
  getAll(userId: string): Reminder[];
  getByDate(date: string, userId: string): Reminder[];
  getTodayReminders(today: string, userId: string): Reminder[];
  getById(id: string, userId: string): Reminder | undefined;
  create(id: string, input: NewReminderInput, userId: string): Reminder;
  update(id: string, patch: UpdateReminderInput, userId: string): Reminder | undefined;
  delete(id: string, userId: string): boolean;
}
