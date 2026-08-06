import type {
  NewNotificationInput,
  Notification,
  NotificationWithTask,
  UpdateNotificationInput,
} from "../domain/types.js";

export interface NotificationRepository {
  findById(id: string): Promise<Notification | null>;
  findByUserId(userId: string): Promise<NotificationWithTask[]>;
  findByTaskId(taskId: string): Promise<Notification[]>;
  findPendingNotifications(): Promise<NotificationWithTask[]>;
  getUnreadCount(userId: string): Promise<number>;
  create(input: NewNotificationInput): Promise<Notification>;
  update(id: string, input: UpdateNotificationInput): Promise<Notification | null>;
  delete(id: string): Promise<boolean>;
  deleteByTaskId(taskId: string): Promise<boolean>;
}
