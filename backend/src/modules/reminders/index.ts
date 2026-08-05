import type Database from "better-sqlite3";
import { SqliteReminderRepository } from "./adapters/sqlite-reminder-repository.js";
import { createRemindersRouter } from "./api/router.js";
import { ReminderService } from "./application/reminder-service.js";

export function initRemindersModule(db: Database.Database) {
  const repo = new SqliteReminderRepository(db);
  const reminderService = new ReminderService(repo);
  const router = createRemindersRouter(reminderService);

  return {
    reminderService,
    router,
  };
}

export type { ReminderService } from "./application/reminder-service.js";
