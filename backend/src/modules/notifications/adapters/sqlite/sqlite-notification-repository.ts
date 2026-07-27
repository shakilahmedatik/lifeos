import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";

import { nowIsoInDhaka } from "../../../../shared/timezone.js";
import type {
  NewNotificationInput,
  Notification,
  NotificationWithTask,
  UpdateNotificationInput,
} from "../../domain/types.js";
import type { NotificationRepository } from "../../ports/notification-repository.js";

export class SqliteNotificationRepository implements NotificationRepository {
  constructor(private db: Database.Database) {}

  findById(id: string): Notification | null {
    const row = this.db.prepare("SELECT * FROM notifications WHERE id = ?").get(id) as
      | Notification
      | undefined;
    return row || null;
  }

  findByUserId(userId: string): NotificationWithTask[] {
    const rows = this.db
      .prepare(`
      SELECT
        n.*,
        t.title as taskTitle,
        t.date as taskDate,
        t.start_time as taskStartTime
      FROM notifications n
      JOIN tasks t ON n.task_id = t.id
      WHERE n.user_id = ?
      ORDER BY n.reminder_time ASC
    `)
      .all(userId) as NotificationWithTask[];
    return rows;
  }

  findByTaskId(taskId: string): Notification[] {
    const rows = this.db
      .prepare("SELECT * FROM notifications WHERE task_id = ?")
      .all(taskId) as Notification[];
    return rows;
  }

  findPendingNotifications(): NotificationWithTask[] {
    const now = new Date().toISOString();
    const rows = this.db
      .prepare(`
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
    `)
      .all(now) as NotificationWithTask[];
    return rows;
  }

  getUnreadCount(userId: string): number {
    const result = this.db
      .prepare(
        "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND status = 'scheduled'",
      )
      .get(userId) as { count: number } | undefined;
    return result?.count ?? 0;
  }

  create(input: NewNotificationInput): Notification {
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

    this.db
      .prepare(`
      INSERT INTO notifications (id, task_id, user_id, reminder_time, sound_type, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .run(
        notification.id,
        notification.taskId,
        notification.userId,
        notification.reminderTime,
        notification.soundType,
        notification.status,
        notification.createdAt,
        notification.updatedAt,
      );

    return notification;
  }

  update(id: string, input: UpdateNotificationInput): Notification | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: (string | undefined)[] = [];

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

    this.db
      .prepare(`
      UPDATE notifications SET ${updates.join(", ")} WHERE id = ?
    `)
      .run(...values);

    return this.findById(id);
  }

  delete(id: string): boolean {
    const result = this.db.prepare("DELETE FROM notifications WHERE id = ?").run(id);
    return result.changes > 0;
  }

  deleteByTaskId(taskId: string): boolean {
    const result = this.db.prepare("DELETE FROM notifications WHERE task_id = ?").run(taskId);
    return result.changes > 0;
  }
}
