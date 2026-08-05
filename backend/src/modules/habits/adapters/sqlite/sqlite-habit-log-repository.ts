import type Database from "better-sqlite3";

import type { HabitLogEntry, NewHabitLogEntryInput } from "../../domain/types.js";
import type { HabitLogRepository } from "../../ports/habit-log-repository.js";

interface HabitLogRow {
  id: string;
  habit_id: string;
  date: string;
  value: number;
  logged_at: string;
  meta: string | null;
}

function rowToHabitLog(row: HabitLogRow): HabitLogEntry {
  return {
    id: row.id,
    habitId: row.habit_id,
    date: row.date,
    value: row.value,
    loggedAt: row.logged_at,
    meta: row.meta || undefined,
  };
}

export class SqliteHabitLogRepository implements HabitLogRepository {
  constructor(private readonly db: Database.Database) {}

  getById(id: string): HabitLogEntry | undefined {
    const row = this.db.prepare("SELECT * FROM habit_logs WHERE id = ?").get(id) as
      | HabitLogRow
      | undefined;
    return row ? rowToHabitLog(row) : undefined;
  }

  getByHabitAndDate(habitId: string, date: string): HabitLogEntry[] {
    const rows = this.db
      .prepare("SELECT * FROM habit_logs WHERE habit_id = ? AND date = ? ORDER BY logged_at ASC")
      .all(habitId, date) as HabitLogRow[];
    return rows.map(rowToHabitLog);
  }

  getByDateRange(startDate: string, endDate: string): HabitLogEntry[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM habit_logs WHERE date >= ? AND date <= ? ORDER BY date, logged_at ASC",
      )
      .all(startDate, endDate) as HabitLogRow[];
    return rows.map(rowToHabitLog);
  }

  getByHabitId(habitId: string): HabitLogEntry[] {
    const rows = this.db
      .prepare("SELECT * FROM habit_logs WHERE habit_id = ? ORDER BY date DESC, logged_at DESC")
      .all(habitId) as HabitLogRow[];
    return rows.map(rowToHabitLog);
  }

  getAllLogs(): HabitLogEntry[] {
    const rows = this.db
      .prepare("SELECT * FROM habit_logs ORDER BY date DESC, logged_at DESC")
      .all() as HabitLogRow[];
    return rows.map(rowToHabitLog);
  }

  create(id: string, input: NewHabitLogEntryInput): HabitLogEntry {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO habit_logs (id, habit_id, date, value, logged_at, meta)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(id, input.habitId, input.date, input.value, now, input.meta ?? null);

    return this.getById(id) as HabitLogEntry;
  }

  delete(id: string): boolean {
    const result = this.db.prepare("DELETE FROM habit_logs WHERE id = ?").run(id);
    return result.changes > 0;
  }

  deleteByHabitId(habitId: string): void {
    this.db.prepare("DELETE FROM habit_logs WHERE habit_id = ?").run(habitId);
  }
}
