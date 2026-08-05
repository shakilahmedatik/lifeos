import type { NewReminderInput, Reminder, UpdateReminderInput } from "../domain/types.js";

export interface ReminderRepository {
  getAll(): Reminder[];
  getByDate(date: string): Reminder[];
  getTodayReminders(today: string): Reminder[];
  getById(id: string): Reminder | undefined;
  create(id: string, input: NewReminderInput): Reminder;
  update(id: string, patch: UpdateReminderInput): Reminder | undefined;
  delete(id: string): boolean;
}
