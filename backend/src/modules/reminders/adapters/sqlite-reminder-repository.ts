import type Database from "better-sqlite3";
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
  constructor(private readonly db: Database.Database) {}

  getAll(): Reminder[] {
    const rows = this.db
      .prepare("SELECT * FROM reminders ORDER BY time ASC, created_at DESC")
      .all() as ReminderRow[];
    return rows.map(mapRowToReminder);
  }

  getByDate(date: string): Reminder[] {
    const rows = this.db
      .prepare("SELECT * FROM reminders WHERE date = ? OR date IS NULL ORDER BY time ASC")
      .all(date) as ReminderRow[];
    return rows.map(mapRowToReminder);
  }

  getTodayReminders(today: string): Reminder[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM reminders WHERE (date = ? OR date IS NULL) AND completed = 0 ORDER BY time ASC",
      )
      .all(today) as ReminderRow[];
    return rows.map(mapRowToReminder);
  }

  getById(id: string): Reminder | undefined {
    const row = this.db.prepare("SELECT * FROM reminders WHERE id = ?").get(id) as
      | ReminderRow
      | undefined;
    return row ? mapRowToReminder(row) : undefined;
  }

  create(id: string, input: NewReminderInput): Reminder {
    const now = new Date().toISOString();
    const kind = input.kind || "reminder";
    const date = input.date ?? null;

    this.db
      .prepare(
        `INSERT INTO reminders (id, title, time, date, kind, completed, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
      )
      .run(id, input.title, input.time, date, kind, now, now);

    const reminder = this.getById(id);
    if (!reminder) {
      throw new Error(`Failed to retrieve created reminder with id: ${id}`);
    }
    return reminder;
  }

  update(id: string, patch: UpdateReminderInput): Reminder | undefined {
    const existing = this.getById(id);
    if (!existing) return undefined;

    const now = new Date().toISOString();
    const title = patch.title ?? existing.title;
    const time = patch.time ?? existing.time;
    const date = patch.date !== undefined ? patch.date : existing.date;
    const kind = patch.kind ?? existing.kind;
    const completed =
      patch.completed !== undefined ? (patch.completed ? 1 : 0) : existing.completed ? 1 : 0;

    this.db
      .prepare(
        `UPDATE reminders
         SET title = ?, time = ?, date = ?, kind = ?, completed = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(title, time, date, kind, completed, now, id);

    return this.getById(id);
  }

  delete(id: string): boolean {
    const res = this.db.prepare("DELETE FROM reminders WHERE id = ?").run(id);
    return res.changes > 0;
  }
}
