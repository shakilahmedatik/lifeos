import type { Client } from "@libsql/client";
import { SqliteNotificationRepository } from "./adapters/sqlite/sqlite-notification-repository.js";
import { createNotificationsRouter } from "./api/router.js";
import { NotificationScheduler } from "./application/notification-scheduler.js";
import { NotificationService } from "./application/notification-service.js";

export function initNotificationsModule(client: Client) {
  const notificationRepo = new SqliteNotificationRepository(client);
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
