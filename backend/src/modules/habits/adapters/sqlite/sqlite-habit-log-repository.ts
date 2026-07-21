import type Database from "better-sqlite3";

import type { HabitLog, NewHabitLogInput } from "../../domain/types.js";
import type { HabitLogRepository } from "../../ports/habit-log-repository.js";

interface HabitLogRow {
  id: string;
  habit_id: string;
  date: string;
  completed_at: string;
}

function rowToHabitLog(row: HabitLogRow): HabitLog {
  return {
    id: row.id,
    habitId: row.habit_id,
    date: row.date,
    completedAt: row.completed_at,
  };
}

export class SqliteHabitLogRepository implements HabitLogRepository {
  constructor(private readonly db: Database.Database) {}

  getById(id: string): HabitLog | undefined {
    const row = this.db.prepare("SELECT * FROM habit_logs WHERE id = ?").get(id) as
      | HabitLogRow
      | undefined;
    return row ? rowToHabitLog(row) : undefined;
  }

  getByHabitAndDate(habitId: string, date: string): HabitLog | undefined {
    const row = this.db
      .prepare("SELECT * FROM habit_logs WHERE habit_id = ? AND date = ?")
      .get(habitId, date) as HabitLogRow | undefined;
    return row ? rowToHabitLog(row) : undefined;
  }

  getByDateRange(startDate: string, endDate: string): HabitLog[] {
    const rows = this.db
      .prepare("SELECT * FROM habit_logs WHERE date >= ? AND date <= ? ORDER BY date")
      .all(startDate, endDate) as HabitLogRow[];
    return rows.map(rowToHabitLog);
  }

  getByHabitId(habitId: string): HabitLog[] {
    const rows = this.db
      .prepare("SELECT * FROM habit_logs WHERE habit_id = ? ORDER BY date DESC")
      .all(habitId) as HabitLogRow[];
    return rows.map(rowToHabitLog);
  }

  create(id: string, input: NewHabitLogInput): HabitLog {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO habit_logs (id, habit_id, date, completed_at)
         VALUES (?, ?, ?, ?)`,
      )
      .run(id, input.habitId, input.date, now);

    return this.getById(id) as HabitLog;
  }

  delete(id: string): boolean {
    const result = this.db.prepare("DELETE FROM habit_logs WHERE id = ?").run(id);
    return result.changes > 0;
  }

  deleteByHabitId(habitId: string): void {
    this.db.prepare("DELETE FROM habit_logs WHERE habit_id = ?").run(habitId);
  }
}
