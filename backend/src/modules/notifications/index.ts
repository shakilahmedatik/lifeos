import type Database from "better-sqlite3";
import { SqliteNotificationRepository } from "./adapters/sqlite/sqlite-notification-repository.js";
import { createNotificationsRouter } from "./api/router.js";
import { NotificationBroadcaster } from "./application/notification-broadcaster.js";
import { NotificationScheduler } from "./application/notification-scheduler.js";
import { NotificationService } from "./application/notification-service.js";

export function initNotificationsModule(db: Database.Database) {
  const notificationRepo = new SqliteNotificationRepository(db);
  const notificationService = new NotificationService(notificationRepo);
  const notificationBroadcaster = new NotificationBroadcaster();
  const notificationScheduler = new NotificationScheduler(
    notificationService,
    notificationBroadcaster,
  );

  const router = createNotificationsRouter(notificationService, notificationBroadcaster);

  return {
    notificationRepo,
    notificationService,
    notificationBroadcaster,
    notificationScheduler,
    router,
  };
}
