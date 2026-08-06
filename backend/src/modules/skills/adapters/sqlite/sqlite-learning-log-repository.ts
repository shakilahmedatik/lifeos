import type { Client } from "@libsql/client";

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
  constructor(private readonly client: Client) {}

  async getById(id: string): Promise<LearningLog | undefined> {
    const res = await this.client.execute({
      sql: "SELECT * FROM learning_logs WHERE id = ?",
      args: [id],
    });
    const row = res.rows[0] as unknown as LearningLogRow | undefined;
    return row ? rowToLog(row) : undefined;
  }

  async getByResourceId(resourceId: string): Promise<LearningLog[]> {
    const res = await this.client.execute({
      sql: "SELECT * FROM learning_logs WHERE resource_id = ? ORDER BY date DESC",
      args: [resourceId],
    });
    const rows = res.rows as unknown as LearningLogRow[];
    return rows.map(rowToLog);
  }

  async getByResourceIds(resourceIds: string[]): Promise<LearningLog[]> {
    if (resourceIds.length === 0) return [];
    const placeholders = resourceIds.map(() => "?").join(",");
    const res = await this.client.execute({
      sql: `SELECT * FROM learning_logs WHERE resource_id IN (${placeholders}) ORDER BY date`,
      args: resourceIds,
    });
    const rows = res.rows as unknown as LearningLogRow[];
    return rows.map(rowToLog);
  }

  async getByDateRange(startDate: string, endDate: string): Promise<LearningLog[]> {
    const res = await this.client.execute({
      sql: "SELECT * FROM learning_logs WHERE date >= ? AND date <= ? ORDER BY date",
      args: [startDate, endDate],
    });
    const rows = res.rows as unknown as LearningLogRow[];
    return rows.map(rowToLog);
  }

  async create(id: string, input: NewLearningLogInput): Promise<LearningLog> {
    const now = new Date().toISOString();
    await this.client.execute({
      sql: `INSERT INTO learning_logs (id, resource_id, date, minutes_spent, units_completed, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        input.resourceId,
        input.date,
        input.minutesSpent,
        input.unitsCompleted ?? null,
        input.notes ?? null,
        now,
        now,
      ],
    });
    return (await this.getById(id)) as LearningLog;
  }

  async update(id: string, patch: Partial<NewLearningLogInput>): Promise<LearningLog | undefined> {
    const existing = await this.getById(id);
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

    await this.client.execute({
      sql: `UPDATE learning_logs SET ${fields.join(", ")} WHERE id = ?`,
      args: values,
    });
    return await this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.client.execute({
      sql: "DELETE FROM learning_logs WHERE id = ?",
      args: [id],
    });
    return res.rowsAffected > 0;
  }
}
