import type { Client } from "@libsql/client";
import type { NewReminderInput, Reminder, UpdateReminderInput } from "../domain/types.js";
import type { ReminderRepository } from "../ports/reminder-repository.js";

interface ReminderRow {
  id: string;
  title: string;
  time: string;
  date: string | null;
  kind: string;
  completed: number;
  created_at: string;
  updated_at: string;
}

function mapRowToReminder(row: ReminderRow): Reminder {
  return {
    id: row.id,
    title: row.title,
    time: row.time,
    date: row.date,
    kind: (row.kind as "reminder" | "event") || "reminder",
    completed: Boolean(row.completed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteReminderRepository implements ReminderRepository {
  constructor(private readonly client: Client) {}

  async getAll(userId: string): Promise<Reminder[]> {
    const res = await this.client.execute({
      sql: "SELECT * FROM reminders WHERE (user_id = ? OR user_id = '') AND deleted_at IS NULL ORDER BY time ASC, created_at DESC",
      args: [userId],
    });
    const rows = res.rows as unknown as ReminderRow[];
    return rows.map(mapRowToReminder);
  }

  async getByDate(date: string, userId: string): Promise<Reminder[]> {
    const res = await this.client.execute({
      sql: "SELECT * FROM reminders WHERE (user_id = ? OR user_id = '') AND (date = ? OR date IS NULL) AND deleted_at IS NULL ORDER BY time ASC",
      args: [userId, date],
    });
    const rows = res.rows as unknown as ReminderRow[];
    return rows.map(mapRowToReminder);
  }

  async getTodayReminders(today: string, userId: string): Promise<Reminder[]> {
    const res = await this.client.execute({
      sql: "SELECT * FROM reminders WHERE (user_id = ? OR user_id = '') AND (date = ? OR date IS NULL) AND completed = 0 AND deleted_at IS NULL ORDER BY time ASC",
      args: [userId, today],
    });
    const rows = res.rows as unknown as ReminderRow[];
    return rows.map(mapRowToReminder);
  }

  async getById(id: string, userId: string): Promise<Reminder | undefined> {
    const res = await this.client.execute({
      sql: "SELECT * FROM reminders WHERE id = ? AND (user_id = ? OR user_id = '') AND deleted_at IS NULL",
      args: [id, userId],
    });
    const row = res.rows[0] as unknown as ReminderRow | undefined;
    return row ? mapRowToReminder(row) : undefined;
  }

  async create(id: string, input: NewReminderInput, userId: string): Promise<Reminder> {
    const now = new Date().toISOString();
    const kind = input.kind || "reminder";
    const date = input.date ?? null;

    await this.client.execute({
      sql: `INSERT INTO reminders (id, user_id, title, time, date, kind, completed, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      args: [id, userId, input.title, input.time, date, kind, now, now],
    });

    const reminder = await this.getById(id, userId);
    if (!reminder) {
      throw new Error(`Failed to retrieve created reminder with id: ${id}`);
    }
    return reminder;
  }

  async update(
    id: string,
    patch: UpdateReminderInput,
    userId: string,
  ): Promise<Reminder | undefined> {
    const existing = await this.getById(id, userId);
    if (!existing) return undefined;

    const now = new Date().toISOString();
    const title = patch.title ?? existing.title;
    const time = patch.time ?? existing.time;
    const date = patch.date !== undefined ? patch.date : existing.date;
    const kind = patch.kind ?? existing.kind;
    const completed =
      patch.completed !== undefined ? (patch.completed ? 1 : 0) : existing.completed ? 1 : 0;

    await this.client.execute({
      sql: `UPDATE reminders
            SET title = ?, time = ?, date = ?, kind = ?, completed = ?, updated_at = ?
            WHERE id = ? AND (user_id = ? OR user_id = '') AND deleted_at IS NULL`,
      args: [title, time, date, kind, completed, now, id, userId],
    });

    return await this.getById(id, userId);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const now = new Date().toISOString();
    const res = await this.client.execute({
      sql: "UPDATE reminders SET deleted_at = ?, updated_at = ? WHERE id = ? AND (user_id = ? OR user_id = '') AND deleted_at IS NULL",
      args: [now, now, id, userId],
    });
    return res.rowsAffected > 0;
  }
}
