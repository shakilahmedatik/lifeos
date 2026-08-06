import type { Client } from "@libsql/client";

import type { LearningResource, NewLearningResourceInput } from "../../domain/types.js";
import type { LearningResourceRepository } from "../../ports/learning-resource-repository.js";

interface LearningResourceRow {
  id: string;
  skill_area_id: string;
  title: string;
  type: string;
  total_units: number | null;
  unit: string | null;
  created_at: string;
  updated_at: string;
}

function rowToResource(row: LearningResourceRow): LearningResource {
  return {
    id: row.id,
    skillAreaId: row.skill_area_id,
    title: row.title,
    type: row.type as LearningResource["type"],
    totalUnits: row.total_units ?? undefined,
    unit: row.unit as LearningResource["unit"] | undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteLearningResourceRepository implements LearningResourceRepository {
  constructor(private readonly client: Client) {}

  async getById(id: string): Promise<LearningResource | undefined> {
    const res = await this.client.execute({
      sql: "SELECT * FROM learning_resources WHERE id = ?",
      args: [id],
    });
    const row = res.rows[0] as unknown as LearningResourceRow | undefined;
    return row ? rowToResource(row) : undefined;
  }

  async getBySkillArea(skillAreaId: string): Promise<LearningResource[]> {
    const res = await this.client.execute({
      sql: "SELECT * FROM learning_resources WHERE skill_area_id = ? ORDER BY title",
      args: [skillAreaId],
    });
    const rows = res.rows as unknown as LearningResourceRow[];
    return rows.map(rowToResource);
  }

  async getAll(): Promise<LearningResource[]> {
    const res = await this.client.execute("SELECT * FROM learning_resources ORDER BY title");
    const rows = res.rows as unknown as LearningResourceRow[];
    return rows.map(rowToResource);
  }

  async create(id: string, input: NewLearningResourceInput): Promise<LearningResource> {
    const now = new Date().toISOString();
    await this.client.execute({
      sql: `INSERT INTO learning_resources (id, skill_area_id, title, type, total_units, unit, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        input.skillAreaId,
        input.title,
        input.type,
        input.totalUnits ?? null,
        input.unit ?? null,
        now,
        now,
      ],
    });
    return (await this.getById(id)) as LearningResource;
  }

  async update(
    id: string,
    patch: Partial<NewLearningResourceInput>,
  ): Promise<LearningResource | undefined> {
    const existing = await this.getById(id);
    if (!existing) return undefined;

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (patch.title !== undefined) {
      fields.push("title = ?");
      values.push(patch.title);
    }
    if (patch.type !== undefined) {
      fields.push("type = ?");
      values.push(patch.type);
    }
    if (patch.skillAreaId !== undefined) {
      fields.push("skill_area_id = ?");
      values.push(patch.skillAreaId);
    }
    if (patch.totalUnits !== undefined) {
      fields.push("total_units = ?");
      values.push(patch.totalUnits);
    }
    if (patch.unit !== undefined) {
      fields.push("unit = ?");
      values.push(patch.unit);
    }

    if (fields.length === 0) return existing;
    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    await this.client.execute({
      sql: `UPDATE learning_resources SET ${fields.join(", ")} WHERE id = ?`,
      args: values,
    });
    return await this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.client.execute({
      sql: "DELETE FROM learning_resources WHERE id = ?",
      args: [id],
    });
    return res.rowsAffected > 0;
  }
}
