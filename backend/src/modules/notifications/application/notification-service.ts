import type {
  NewNotificationInput,
  Notification,
  NotificationWithTask,
  UpdateNotificationInput,
} from "../domain/types.js";
import type { NotificationRepository } from "../ports/notification-repository.js";

export class NotificationService {
  constructor(private notificationRepo: NotificationRepository) {}

  listNotifications(userId: string): NotificationWithTask[] {
    return this.notificationRepo.findByUserId(userId);
  }

  getNotification(id: string): Notification | null {
    return this.notificationRepo.findById(id);
  }

  createNotification(input: NewNotificationInput): Notification {
    return this.notificationRepo.create(input);
  }

  updateNotification(id: string, input: UpdateNotificationInput): Notification | null {
    return this.notificationRepo.update(id, input);
  }

  deleteNotification(id: string): boolean {
    return this.notificationRepo.delete(id);
  }

  deleteNotificationsByTaskId(taskId: string): boolean {
    return this.notificationRepo.deleteByTaskId(taskId);
  }

  getPendingNotifications(): NotificationWithTask[] {
    return this.notificationRepo.findPendingNotifications();
  }

  getUnreadCount(userId = "default"): number {
    return this.notificationRepo.getUnreadCount(userId);
  }

  markNotificationAsSent(id: string): Notification | null {
    return this.notificationRepo.update(id, { status: "sent" });
  }

  processDueRemindersForUser(userId = "default"): void {
    const pending = this.notificationRepo.findPendingNotifications();
    for (const notification of pending) {
      if (notification.userId === userId || userId === "default") {
        this.markNotificationAsSent(notification.id);
      }
    }
  }
}
