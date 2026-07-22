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

    console.log(`Notification scheduler started with ${intervalMs}ms interval`);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("Notification scheduler stopped");
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
      console.error("Error checking notifications:", error);
    }
  }

  private async sendNotification(notification: NotificationWithTask): Promise<void> {
    console.log(`Sending notification: ${notification.taskTitle} at ${notification.reminderTime}`);

    if (this.broadcaster) {
      this.broadcaster.broadcast(notification);
    }

    for (const listener of this.listeners) {
      try {
        listener(notification);
      } catch (error) {
        console.error("Error in notification listener:", error);
      }
    }
  }
}
