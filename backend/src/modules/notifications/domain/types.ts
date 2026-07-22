export type NotificationSoundType = "default" | "gentle" | "urgent" | "chime" | "bell";

export type NotificationStatus = "scheduled" | "sent" | "cancelled" | "expired";

export interface Notification {
  id: string;
  taskId: string;
  userId: string;
  reminderTime: string;
  soundType: NotificationSoundType;
  status: NotificationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface NewNotificationInput {
  taskId: string;
  userId?: string;
  reminderTime: string;
  soundType?: NotificationSoundType;
}

export interface UpdateNotificationInput {
  reminderTime?: string;
  soundType?: NotificationSoundType;
  status?: NotificationStatus;
}

export interface NotificationWithTask extends Notification {
  taskTitle: string;
  taskDate: string;
  taskStartTime: string;
}
