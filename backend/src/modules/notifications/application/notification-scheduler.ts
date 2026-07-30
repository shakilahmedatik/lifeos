import { logger } from "../../../shared/logger.js";
import type { NotificationWithTask } from "../domain/types.js";
import type { NotificationBroadcaster } from "./notification-broadcaster.js";
import type { NotificationService } from "./notification-service.js";

export type NotificationCallback = (notification: NotificationWithTask) => void;

export class NotificationScheduler {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  public listeners: NotificationCallback[] = [];

  constructor(
    private notificationService: NotificationService,
    public broadcaster?: NotificationBroadcaster,
  ) {}

  start(intervalMs = 10000): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.checkAndSendNotifications();
    }, intervalMs);

    logger.info("Notification scheduler started", { intervalMs });
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info("Notification scheduler stopped");
    }
  }

  onNotification(callback: NotificationCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  public async checkAndSendNotifications(): Promise<void> {
    try {
      const pendingNotifications = this.notificationService.getPendingNotifications();

      for (const notification of pendingNotifications) {
        await this.sendNotification(notification);
        this.notificationService.markNotificationAsSent(notification.id);
      }
    } catch (error) {
      logger.error("Error checking notifications", { error: (error as Error).message });
    }
  }

  private async sendNotification(notification: NotificationWithTask): Promise<void> {
    logger.info("Sending notification", {
      taskTitle: notification.taskTitle,
      reminderTime: notification.reminderTime,
    });

    if (this.broadcaster) {
      this.broadcaster.broadcast(notification);
    }

    for (const listener of this.listeners) {
      try {
        listener(notification);
      } catch (error) {
        logger.error("Error in notification listener", { error: (error as Error).message });
      }
    }
  }
}
