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
        `INSERT INTO learning_logs (id, resource_id, date, minutes_spent, units_completed, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.resourceId,
        input.date,
        input.minutesSpent,
        input.unitsCompleted ?? null,
        input.notes ?? null,
        now,
      );
    return this.getById(id) as LearningLog;
  }

  delete(id: string): boolean {
    const result = this.db.prepare("DELETE FROM learning_logs WHERE id = ?").run(id);
    return result.changes > 0;
  }
}
