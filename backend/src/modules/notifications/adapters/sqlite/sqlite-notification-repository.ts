import { randomUUID } from "node:crypto";
import type { Client } from "@libsql/client";

import type {
  NewNotificationInput,
  Notification,
  NotificationSoundType,
  NotificationWithTask,
  UpdateNotificationInput,
} from "../../domain/types.js";
import type { NotificationRepository } from "../../ports/notification-repository.js";

interface NotificationRow {
  id: string;
  task_id: string;
  user_id: string;
  reminder_time: string;
  sound_type: string;
  status: Notification["status"];
  created_at: string;
  updated_at: string;
  taskTitle?: string;
  taskDate?: string;
  taskStartTime?: string;
}

function rowToNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    taskId: row.task_id,
    userId: row.user_id,
    reminderTime: row.reminder_time,
    soundType: row.sound_type as NotificationSoundType,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToNotificationWithTask(row: NotificationRow): NotificationWithTask {
  return {
    ...rowToNotification(row),
    taskTitle: row.taskTitle ?? "",
    taskDate: row.taskDate ?? "",
    taskStartTime: row.taskStartTime ?? "",
  };
}

export class SqliteNotificationRepository implements NotificationRepository {
  constructor(private client: Client) {}

  async findById(id: string): Promise<Notification | null> {
    const res = await this.client.execute({
      sql: "SELECT * FROM notifications WHERE id = ?",
      args: [id],
    });
    const row = res.rows[0] as unknown as NotificationRow | undefined;
    return row ? rowToNotification(row) : null;
  }

  async findByUserId(userId: string): Promise<NotificationWithTask[]> {
    const res = await this.client.execute({
      sql: `
        SELECT
          n.*,
          t.title as taskTitle,
          t.date as taskDate,
          t.start_time as taskStartTime
        FROM notifications n
        JOIN tasks t ON n.task_id = t.id
        WHERE (n.user_id = ? OR n.user_id = 'default' OR ? = 'default')
        ORDER BY n.reminder_time ASC
      `,
      args: [userId, userId],
    });
    const rows = res.rows as unknown as NotificationRow[];
    return rows.map(rowToNotificationWithTask);
  }

  async findByTaskId(taskId: string): Promise<Notification[]> {
    const res = await this.client.execute({
      sql: "SELECT * FROM notifications WHERE task_id = ?",
      args: [taskId],
    });
    const rows = res.rows as unknown as NotificationRow[];
    return rows.map(rowToNotification);
  }

  async findPendingNotifications(): Promise<NotificationWithTask[]> {
    const now = new Date().toISOString();
    const res = await this.client.execute({
      sql: `
        SELECT
          n.*,
          t.title as taskTitle,
          t.date as taskDate,
          t.start_time as taskStartTime
        FROM notifications n
        JOIN tasks t ON n.task_id = t.id
        WHERE n.status = 'scheduled'
          AND n.reminder_time <= ?
        ORDER BY n.reminder_time ASC
      `,
      args: [now],
    });
    const rows = res.rows as unknown as NotificationRow[];
    return rows.map(rowToNotificationWithTask);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const res = await this.client.execute({
      sql: "SELECT COUNT(*) as count FROM notifications WHERE (user_id = ? OR user_id = 'default' OR ? = 'default') AND status = 'scheduled'",
      args: [userId, userId],
    });
    return Number(res.rows[0]?.count ?? 0);
  }

  async create(input: NewNotificationInput): Promise<Notification> {
    const id = randomUUID();
    const now = new Date().toISOString();

    const notification: Notification = {
      id,
      taskId: input.taskId,
      userId: input.userId || "default",
      reminderTime: input.reminderTime,
      soundType: input.soundType || "default",
      status: "scheduled",
      createdAt: now,
      updatedAt: now,
    };

    await this.client.execute({
      sql: `
        INSERT INTO notifications (id, task_id, user_id, reminder_time, sound_type, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        notification.id,
        notification.taskId,
        notification.userId,
        notification.reminderTime,
        notification.soundType,
        notification.status,
        notification.createdAt,
        notification.updatedAt,
      ],
    });

    return notification;
  }

  async update(id: string, input: UpdateNotificationInput): Promise<Notification | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (input.reminderTime !== undefined) {
      updates.push("reminder_time = ?");
      values.push(input.reminderTime);
    }
    if (input.soundType !== undefined) {
      updates.push("sound_type = ?");
      values.push(input.soundType);
    }
    if (input.status !== undefined) {
      updates.push("status = ?");
      values.push(input.status);
    }

    if (updates.length === 0) return existing;

    updates.push("updated_at = ?");
    values.push(now);
    values.push(id);

    await this.client.execute({
      sql: `UPDATE notifications SET ${updates.join(", ")} WHERE id = ?`,
      args: values,
    });

    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.client.execute({
      sql: "DELETE FROM notifications WHERE id = ?",
      args: [id],
    });
    return res.rowsAffected > 0;
  }

  async deleteByTaskId(taskId: string): Promise<boolean> {
    const res = await this.client.execute({
      sql: "DELETE FROM notifications WHERE task_id = ?",
      args: [taskId],
    });
    return res.rowsAffected > 0;
  }

  async getSoundPreference(userId: string): Promise<string | null> {
    const key = `sound_preference_${userId || "default"}`;
    const res = await this.client.execute({
      sql: "SELECT value FROM settings WHERE key = ?",
      args: [key],
    });
    return (res.rows[0]?.value as string) || null;
  }

  async setSoundPreference(userId: string, soundType: string): Promise<void> {
    const key = `sound_preference_${userId || "default"}`;
    const now = new Date().toISOString();
    await this.client.execute({
      sql: `
        INSERT INTO settings (key, value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `,
      args: [key, soundType, now],
    });
  }
}
