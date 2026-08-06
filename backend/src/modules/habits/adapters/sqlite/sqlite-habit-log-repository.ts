import type { Client } from "@libsql/client";

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
  constructor(private readonly client: Client) {}

  async getById(id: string, _userId: string): Promise<HabitLogEntry | undefined> {
    const res = await this.client.execute({
      sql: "SELECT * FROM habit_logs WHERE id = ?",
      args: [id],
    });
    const row = res.rows[0] as unknown as HabitLogRow | undefined;
    return row ? rowToHabitLog(row) : undefined;
  }

  async getByHabitAndDate(
    habitId: string,
    date: string,
    _userId: string,
  ): Promise<HabitLogEntry[]> {
    const res = await this.client.execute({
      sql: "SELECT * FROM habit_logs WHERE habit_id = ? AND date = ? ORDER BY logged_at ASC",
      args: [habitId, date],
    });
    const rows = res.rows as unknown as HabitLogRow[];
    return rows.map(rowToHabitLog);
  }

  async getByDateRange(
    startDate: string,
    endDate: string,
    _userId: string,
  ): Promise<HabitLogEntry[]> {
    const res = await this.client.execute({
      sql: "SELECT * FROM habit_logs WHERE date >= ? AND date <= ? ORDER BY date, logged_at ASC",
      args: [startDate, endDate],
    });
    const rows = res.rows as unknown as HabitLogRow[];
    return rows.map(rowToHabitLog);
  }

  async getByHabitId(habitId: string, _userId: string): Promise<HabitLogEntry[]> {
    const res = await this.client.execute({
      sql: "SELECT * FROM habit_logs WHERE habit_id = ? ORDER BY date DESC, logged_at DESC",
      args: [habitId],
    });
    const rows = res.rows as unknown as HabitLogRow[];
    return rows.map(rowToHabitLog);
  }

  async getAllLogs(_userId: string): Promise<HabitLogEntry[]> {
    const res = await this.client.execute({
      sql: "SELECT * FROM habit_logs ORDER BY date DESC, logged_at DESC",
    });
    const rows = res.rows as unknown as HabitLogRow[];
    return rows.map(rowToHabitLog);
  }

  async create(id: string, input: NewHabitLogEntryInput, userId: string): Promise<HabitLogEntry> {
    const now = new Date().toISOString();
    await this.client.execute({
      sql: `INSERT INTO habit_logs (id, habit_id, date, value, logged_at, meta)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, input.habitId, input.date, input.value, now, input.meta ?? null],
    });

    return (await this.getById(id, userId)) as HabitLogEntry;
  }

  async delete(id: string, _userId: string): Promise<boolean> {
    const res = await this.client.execute({
      sql: "DELETE FROM habit_logs WHERE id = ?",
      args: [id],
    });
    return res.rowsAffected > 0;
  }

  async deleteByHabitId(habitId: string, _userId: string): Promise<void> {
    await this.client.execute({
      sql: "DELETE FROM habit_logs WHERE habit_id = ?",
      args: [habitId],
    });
  }
}
