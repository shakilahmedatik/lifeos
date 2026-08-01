import { logger } from "../../../shared/logger.js";
import type { NotificationWithTask } from "../domain/types.js";
import type { NotificationBroadcaster } from "./notification-broadcaster.js";
import type { NotificationService } from "./notification-service.js";

export type NotificationCallback = (notification: NotificationWithTask) => void;

export class NotificationScheduler {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private lastRun: string | undefined;
  private error: string | undefined;
  public listeners: NotificationCallback[] = [];

  constructor(
    private notificationService: NotificationService,
    public broadcaster?: NotificationBroadcaster,
  ) {}

  start(intervalMs = 10000): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      if (!this.running) {
        this.checkAndSendNotifications();
      }
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

  public async checkAndSendNotifications(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const pendingNotifications = this.notificationService.getPendingNotifications();

      for (const notification of pendingNotifications) {
        await this.sendNotification(notification);
        this.notificationService.markNotificationAsSent(notification.id);
      }
      this.lastRun = new Date().toISOString();
      this.error = undefined;
    } catch (error) {
      logger.error("Error checking notifications", { error: (error as Error).message });
      this.error = (error as Error).message;
      this.lastRun = new Date().toISOString();
    } finally {
      this.running = false;
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
