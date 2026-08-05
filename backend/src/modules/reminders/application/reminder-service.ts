import { randomUUID } from "node:crypto";
import type { NewReminderInput, Reminder, UpdateReminderInput } from "../domain/types.js";
import type { ReminderRepository } from "../ports/reminder-repository.js";

export class ReminderService {
  constructor(private readonly repo: ReminderRepository) {}

  getAll(): Reminder[] {
    return this.repo.getAll();
  }

  getByDate(date: string): Reminder[] {
    return this.repo.getByDate(date);
  }

  getTodayReminders(today: string): Reminder[] {
    return this.repo.getTodayReminders(today);
  }

  getUpcomingToday(today: string, limit = 4): Reminder[] {
    const todayReminders = this.repo.getTodayReminders(today);
    return todayReminders.slice(0, limit);
  }

  getById(id: string): Reminder | undefined {
    return this.repo.getById(id);
  }

  create(input: NewReminderInput): Reminder {
    const id = randomUUID();
    return this.repo.create(id, input);
  }

  update(id: string, patch: UpdateReminderInput): Reminder | undefined {
    return this.repo.update(id, patch);
  }

  delete(id: string): boolean {
    return this.repo.delete(id);
  }
}
