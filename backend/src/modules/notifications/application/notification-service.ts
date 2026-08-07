import type {
  NewNotificationInput,
  Notification,
  NotificationWithTask,
  UpdateNotificationInput,
} from "../domain/types.js";
import type { NotificationRepository } from "../ports/notification-repository.js";

export class NotificationService {
  constructor(private notificationRepo: NotificationRepository) {}

  async listNotifications(userId: string): Promise<NotificationWithTask[]> {
    return await this.notificationRepo.findByUserId(userId);
  }

  async getNotification(id: string): Promise<Notification | null> {
    return await this.notificationRepo.findById(id);
  }

  async createNotification(input: NewNotificationInput): Promise<Notification> {
    return await this.notificationRepo.create(input);
  }

  async updateNotification(
    id: string,
    input: UpdateNotificationInput,
  ): Promise<Notification | null> {
    return await this.notificationRepo.update(id, input);
  }

  async deleteNotification(id: string): Promise<boolean> {
    return await this.notificationRepo.delete(id);
  }

  async deleteNotificationsByTaskId(taskId: string): Promise<boolean> {
    return await this.notificationRepo.deleteByTaskId(taskId);
  }

  async getPendingNotifications(): Promise<NotificationWithTask[]> {
    return await this.notificationRepo.findPendingNotifications();
  }

  async getUnreadCount(userId = "default"): Promise<number> {
    return await this.notificationRepo.getUnreadCount(userId);
  }

  async markNotificationAsSent(id: string): Promise<Notification | null> {
    return await this.notificationRepo.update(id, { status: "sent" });
  }

  async processDueRemindersForUser(userId = "default"): Promise<NotificationWithTask[]> {
    const pending = await this.notificationRepo.findPendingNotifications();
    const processed: NotificationWithTask[] = [];
    for (const notification of pending) {
      if (
        notification.userId === userId ||
        userId === "default" ||
        notification.userId === "default"
      ) {
        await this.markNotificationAsSent(notification.id);
        processed.push(notification);
      }
    }
    return processed;
  }

  async getSoundPreference(userId = "default"): Promise<string> {
    const pref = await this.notificationRepo.getSoundPreference(userId);
    return pref || "default";
  }

  async setSoundPreference(userId = "default", soundType: string): Promise<void> {
    await this.notificationRepo.setSoundPreference(userId, soundType);
  }
}
