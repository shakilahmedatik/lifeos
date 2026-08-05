import type Database from "better-sqlite3";
import { SqliteNotificationRepository } from "./adapters/sqlite/sqlite-notification-repository.js";
import { createNotificationsRouter } from "./api/router.js";
import { NotificationScheduler } from "./application/notification-scheduler.js";
import { NotificationService } from "./application/notification-service.js";

export function initNotificationsModule(db: Database.Database) {
  const notificationRepo = new SqliteNotificationRepository(db);
  const notificationService = new NotificationService(notificationRepo);
  const notificationScheduler = new NotificationScheduler(notificationService);

  const router = createNotificationsRouter(notificationService);

  return {
    notificationRepo,
    notificationService,
    notificationScheduler,
    router,
  };
}
