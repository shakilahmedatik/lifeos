import type Database from "better-sqlite3";

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
  constructor(private readonly db: Database.Database) {}

  getById(id: string): LearningResource | undefined {
    const row = this.db.prepare("SELECT * FROM learning_resources WHERE id = ?").get(id) as
      | LearningResourceRow
      | undefined;
    return row ? rowToResource(row) : undefined;
  }

  getBySkillArea(skillAreaId: string): LearningResource[] {
    return (
      this.db
        .prepare("SELECT * FROM learning_resources WHERE skill_area_id = ? ORDER BY title")
        .all(skillAreaId) as LearningResourceRow[]
    ).map(rowToResource);
  }

  getAll(): LearningResource[] {
    return (
      this.db
        .prepare("SELECT * FROM learning_resources ORDER BY title")
        .all() as LearningResourceRow[]
    ).map(rowToResource);
  }

  create(id: string, input: NewLearningResourceInput): LearningResource {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO learning_resources (id, skill_area_id, title, type, total_units, unit, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.skillAreaId,
        input.title,
        input.type,
        input.totalUnits ?? null,
        input.unit ?? null,
        now,
        now,
      );
    return this.getById(id) as LearningResource;
  }

  update(id: string, patch: Partial<NewLearningResourceInput>): LearningResource | undefined {
    const existing = this.getById(id);
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

    this.db
      .prepare(`UPDATE learning_resources SET ${fields.join(", ")} WHERE id = ?`)
      .run(...values);
    return this.getById(id);
  }

  delete(id: string): boolean {
    const result = this.db.prepare("DELETE FROM learning_resources WHERE id = ?").run(id);
    return result.changes > 0;
  }
}
