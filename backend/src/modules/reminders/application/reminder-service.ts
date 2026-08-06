import { randomUUID } from "node:crypto";
import { nowIsoInTimezone, todayInTimezone } from "../../../shared/timezone.js";
import type { NewReminderInput, Reminder, UpdateReminderInput } from "../domain/types.js";
import type { ReminderRepository } from "../ports/reminder-repository.js";

export class ReminderService {
  constructor(private readonly repo: ReminderRepository) {}

  async getAll(userId: string): Promise<Reminder[]> {
    return await this.repo.getAll(userId);
  }

  async getByDate(date: string, userId: string): Promise<Reminder[]> {
    return await this.repo.getByDate(date, userId);
  }

  async getTodayReminders(today: string, userId: string): Promise<Reminder[]> {
    return await this.repo.getTodayReminders(today, userId);
  }

  async getUpcomingToday(today: string, userId: string, limit = 4): Promise<Reminder[]> {
    const todayReminders = await this.repo.getTodayReminders(today, userId);
    return todayReminders.slice(0, limit);
  }

  async getById(id: string, userId: string): Promise<Reminder | undefined> {
    return await this.repo.getById(id, userId);
  }

  async create(input: NewReminderInput, userId: string): Promise<Reminder> {
    const id = randomUUID();
    return await this.repo.create(id, input, userId);
  }

  async update(
    id: string,
    patch: UpdateReminderInput,
    userId: string,
  ): Promise<Reminder | undefined> {
    return await this.repo.update(id, patch, userId);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    return await this.repo.delete(id, userId);
  }

  async processDueRemindersForUser(userId: string): Promise<void> {
    const today = todayInTimezone();
    const nowTime = nowIsoInTimezone().slice(11, 16); // HH:mm
    const todayReminders = await this.repo.getTodayReminders(today, userId);

    for (const reminder of todayReminders) {
      if (!reminder.completed && reminder.time <= nowTime) {
        await this.repo.update(reminder.id, { completed: true }, userId);
      }
    }
  }
}
