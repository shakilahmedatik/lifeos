import { and, asc, desc, eq, isNull } from "drizzle-orm";

import type { DrizzleClient } from "../../../../shared/db.js";
import { habitLogs } from "../../../../shared/schema.js";
import type { HabitLogEntry, NewHabitLogEntryInput } from "../../domain/types.js";
import type { HabitLogRepository } from "../../ports/habit-log-repository.js";

function rowToHabitLog(row: typeof habitLogs.$inferSelect): HabitLogEntry {
  return {
    id: row.id,
    habitId: row.habitId,
    date: row.date,
    value: row.value,
    loggedAt: row.loggedAt,
    meta: row.meta || undefined,
  };
}

export class DrizzleHabitLogRepository implements HabitLogRepository {
  constructor(private readonly db: DrizzleClient) {}

  async getById(id: string, _userId: string): Promise<HabitLogEntry | undefined> {
    const [row] = await this.db
      .select()
      .from(habitLogs)
      .where(and(eq(habitLogs.id, id), isNull(habitLogs.deletedAt)));
    return row ? rowToHabitLog(row) : undefined;
  }

  async getByHabitAndDate(
    habitId: string,
    date: string,
    _userId: string,
  ): Promise<HabitLogEntry[]> {
    const rows = await this.db
      .select()
      .from(habitLogs)
      .where(
        and(eq(habitLogs.habitId, habitId), eq(habitLogs.date, date), isNull(habitLogs.deletedAt)),
      )
      .orderBy(asc(habitLogs.loggedAt));
    return rows.map(rowToHabitLog);
  }

  async getByDateRange(
    startDate: string,
    endDate: string,
    _userId: string,
  ): Promise<HabitLogEntry[]> {
    const { gte, lte } = await import("drizzle-orm");
    const rows = await this.db
      .select()
      .from(habitLogs)
      .where(
        and(
          gte(habitLogs.date, startDate),
          lte(habitLogs.date, endDate),
          isNull(habitLogs.deletedAt),
        ),
      )
      .orderBy(asc(habitLogs.date), asc(habitLogs.loggedAt));
    return rows.map(rowToHabitLog);
  }

  async getByHabitId(habitId: string, _userId: string): Promise<HabitLogEntry[]> {
    const rows = await this.db
      .select()
      .from(habitLogs)
      .where(and(eq(habitLogs.habitId, habitId), isNull(habitLogs.deletedAt)))
      .orderBy(desc(habitLogs.date), desc(habitLogs.loggedAt));
    return rows.map(rowToHabitLog);
  }

  async getAllLogs(_userId: string): Promise<HabitLogEntry[]> {
    const rows = await this.db
      .select()
      .from(habitLogs)
      .where(isNull(habitLogs.deletedAt))
      .orderBy(desc(habitLogs.date), desc(habitLogs.loggedAt));
    return rows.map(rowToHabitLog);
  }

  async create(id: string, input: NewHabitLogEntryInput, userId: string): Promise<HabitLogEntry> {
    const now = new Date().toISOString();
    await this.db.insert(habitLogs).values({
      id,
      userId,
      habitId: input.habitId,
      date: input.date,
      value: input.value,
      loggedAt: now,
      meta: input.meta ?? null,
    });

    return (await this.getById(id, userId)) as HabitLogEntry;
  }

  async delete(id: string, _userId: string): Promise<boolean> {
    const now = new Date().toISOString();
    const result = await this.db
      .update(habitLogs)
      .set({ deletedAt: now })
      .where(and(eq(habitLogs.id, id), isNull(habitLogs.deletedAt)));
    return result.rowsAffected > 0;
  }

  async deleteByHabitId(habitId: string, _userId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db
      .update(habitLogs)
      .set({ deletedAt: now })
      .where(and(eq(habitLogs.habitId, habitId), isNull(habitLogs.deletedAt)));
  }
}
