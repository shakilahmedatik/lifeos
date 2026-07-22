import type {
  NewNotificationInput,
  Notification,
  NotificationWithTask,
  UpdateNotificationInput,
} from "../domain/types.js";

export interface NotificationRepository {
  findById(id: string): Notification | null;
  findByUserId(userId: string): NotificationWithTask[];
  findByTaskId(taskId: string): Notification[];
  findPendingNotifications(): NotificationWithTask[];
  create(input: NewNotificationInput): Notification;
  update(id: string, input: UpdateNotificationInput): Notification | null;
  delete(id: string): boolean;
  deleteByTaskId(taskId: string): boolean;
}
