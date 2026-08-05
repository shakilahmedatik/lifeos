import { randomUUID } from "node:crypto";
import type { NewReminderInput, Reminder, UpdateReminderInput } from "../domain/types.js";
import type { ReminderRepository } from "../ports/reminder-repository.js";

export class ReminderService {
  constructor(private readonly repo: ReminderRepository) {}

  getAll(userId: string): Reminder[] {
    return this.repo.getAll(userId);
  }

  getByDate(date: string, userId: string): Reminder[] {
    return this.repo.getByDate(date, userId);
  }

  getTodayReminders(today: string, userId: string): Reminder[] {
    return this.repo.getTodayReminders(today, userId);
  }

  getUpcomingToday(today: string, userId: string, limit = 4): Reminder[] {
    const todayReminders = this.repo.getTodayReminders(today, userId);
    return todayReminders.slice(0, limit);
  }

  getById(id: string, userId: string): Reminder | undefined {
    return this.repo.getById(id, userId);
  }

  create(input: NewReminderInput, userId: string): Reminder {
    const id = randomUUID();
    return this.repo.create(id, input, userId);
  }

  update(id: string, patch: UpdateReminderInput, userId: string): Reminder | undefined {
    return this.repo.update(id, patch, userId);
  }

  delete(id: string, userId: string): boolean {
    return this.repo.delete(id, userId);
  }

  processDueRemindersForUser(userId: string): void {
    const today = new Date().toISOString().split("T")[0];
    const nowTime = new Date().toTimeString().slice(0, 5); // HH:mm
    const todayReminders = this.repo.getTodayReminders(today, userId);

    for (const reminder of todayReminders) {
      if (!reminder.completed && reminder.time <= nowTime) {
        this.repo.update(reminder.id, { completed: true }, userId);
      }
    }
  }
}
