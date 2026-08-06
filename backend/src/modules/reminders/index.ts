import type { Client } from "@libsql/client";
import { SqliteReminderRepository } from "./adapters/sqlite-reminder-repository.js";
import { createRemindersRouter } from "./api/router.js";
import { ReminderService } from "./application/reminder-service.js";

export function initRemindersModule(client: Client) {
  const repo = new SqliteReminderRepository(client);
  const reminderService = new ReminderService(repo);
  const router = createRemindersRouter(reminderService);

  return {
    reminderService,
    router,
  };
}

export type { ReminderService } from "./application/reminder-service.js";
