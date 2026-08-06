import { logger } from "../../../shared/logger.js";
import type { NotificationWithTask } from "../domain/types.js";
import type { NotificationService } from "./notification-service.js";

export type NotificationCallback = (notification: NotificationWithTask) => void;

export class NotificationScheduler {
  private running = false;
  private lastRun: string | undefined;
  private lastRunTimestamp = 0;
  private error: string | undefined;
  public listeners: NotificationCallback[] = [];

  constructor(private notificationService: NotificationService) {}

  start(_intervalMs = 10000): void {
    logger.info("Notification scheduler enabled (lazy request-driven execution)");
    this.checkAndSendNotificationsLazy();
  }

  stop(): void {
    logger.info("Notification scheduler disabled");
  }

  onNotification(callback: NotificationCallback): () => void {
    if (this.listeners.length >= 50) {
      logger.warn("High number of notification listeners registered. Check for memory leak.", {
        count: this.listeners.length,
      });
    }
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  getStatus(): {
    name: string;
    status: "idle" | "running" | "error";
    lastRun?: string;
    error?: string;
  } {
    return {
      name: "notifications",
      status: this.running ? "running" : this.error ? "error" : "idle",
      lastRun: this.lastRun,
      error: this.error,
    };
  }

  public async checkAndSendNotificationsLazy(minIntervalMs = 5000): Promise<void> {
    const now = Date.now();
    if (
      this.running ||
      (this.lastRunTimestamp > 0 && now - this.lastRunTimestamp < minIntervalMs)
    ) {
      return;
    }
    await this.checkAndSendNotifications();
  }

  public async checkAndSendNotifications(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const pendingNotifications = await this.notificationService.getPendingNotifications();

      for (const notification of pendingNotifications) {
        await this.sendNotification(notification);
        await this.notificationService.markNotificationAsSent(notification.id);
      }
      this.lastRunTimestamp = Date.now();
      this.lastRun = new Date(this.lastRunTimestamp).toISOString();
      this.error = undefined;
    } catch (error) {
      logger.error("Error checking notifications", { error: (error as Error).message });
      this.error = (error as Error).message;
      this.lastRunTimestamp = Date.now();
      this.lastRun = new Date(this.lastRunTimestamp).toISOString();
    } finally {
      this.running = false;
    }
  }

  private async sendNotification(notification: NotificationWithTask): Promise<void> {
    logger.info("Sending notification", {
      taskTitle: notification.taskTitle,
      reminderTime: notification.reminderTime,
    });

    for (const listener of this.listeners) {
      try {
        listener(notification);
      } catch (error) {
        logger.error("Error in notification listener", { error: (error as Error).message });
      }
    }
  }
}
