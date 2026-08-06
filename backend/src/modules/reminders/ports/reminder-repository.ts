import type { NewReminderInput, Reminder, UpdateReminderInput } from "../domain/types.js";

export interface ReminderRepository {
  getAll(userId: string): Promise<Reminder[]>;
  getByDate(date: string, userId: string): Promise<Reminder[]>;
  getTodayReminders(today: string, userId: string): Promise<Reminder[]>;
  getById(id: string, userId: string): Promise<Reminder | undefined>;
  create(id: string, input: NewReminderInput, userId: string): Promise<Reminder>;
  update(id: string, patch: UpdateReminderInput, userId: string): Promise<Reminder | undefined>;
  delete(id: string, userId: string): Promise<boolean>;
}
