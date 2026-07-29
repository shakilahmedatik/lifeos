import type Database from "better-sqlite3";

import type { LearningLog, NewLearningLogInput } from "../../domain/types.js";
import type { LearningLogRepository } from "../../ports/learning-log-repository.js";

interface LearningLogRow {
  id: string;
  resource_id: string;
  date: string;
  minutes_spent: number;
  units_completed: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function rowToLog(row: LearningLogRow): LearningLog {
  return {
    id: row.id,
    resourceId: row.resource_id,
    date: row.date,
    minutesSpent: row.minutes_spent,
    unitsCompleted: row.units_completed ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteLearningLogRepository implements LearningLogRepository {
  constructor(private readonly db: Database.Database) {}

  getById(id: string): LearningLog | undefined {
    const row = this.db.prepare("SELECT * FROM learning_logs WHERE id = ?").get(id) as
      | LearningLogRow
      | undefined;
    return row ? rowToLog(row) : undefined;
  }

  getByResourceId(resourceId: string): LearningLog[] {
    return (
      this.db
        .prepare("SELECT * FROM learning_logs WHERE resource_id = ? ORDER BY date DESC")
        .all(resourceId) as LearningLogRow[]
    ).map(rowToLog);
  }

  getByResourceIds(resourceIds: string[]): LearningLog[] {
    if (resourceIds.length === 0) return [];
    const placeholders = resourceIds.map(() => "?").join(",");
    return (
      this.db
        .prepare(`SELECT * FROM learning_logs WHERE resource_id IN (${placeholders}) ORDER BY date`)
        .all(...resourceIds) as LearningLogRow[]
    ).map(rowToLog);
  }

  getByDateRange(startDate: string, endDate: string): LearningLog[] {
    return (
      this.db
        .prepare("SELECT * FROM learning_logs WHERE date >= ? AND date <= ? ORDER BY date")
        .all(startDate, endDate) as LearningLogRow[]
    ).map(rowToLog);
  }

  create(id: string, input: NewLearningLogInput): LearningLog {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO learning_logs (id, resource_id, date, minutes_spent, units_completed, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.resourceId,
        input.date,
        input.minutesSpent,
        input.unitsCompleted ?? null,
        input.notes ?? null,
        now,
        now,
      );
    return this.getById(id) as LearningLog;
  }

  update(id: string, patch: Partial<NewLearningLogInput>): LearningLog | undefined {
    const existing = this.getById(id);
    if (!existing) return undefined;

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (patch.date !== undefined) {
      fields.push("date = ?");
      values.push(patch.date);
    }
    if (patch.minutesSpent !== undefined) {
      fields.push("minutes_spent = ?");
      values.push(patch.minutesSpent);
    }
    if (patch.unitsCompleted !== undefined) {
      fields.push("units_completed = ?");
      values.push(patch.unitsCompleted ?? null);
    }
    if (patch.notes !== undefined) {
      fields.push("notes = ?");
      values.push(patch.notes ?? null);
    }

    if (fields.length === 0) return existing;
    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    this.db.prepare(`UPDATE learning_logs SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    return this.getById(id);
  }

  delete(id: string): boolean {
    const result = this.db.prepare("DELETE FROM learning_logs WHERE id = ?").run(id);
    return result.changes > 0;
  }
}
