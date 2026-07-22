import type Database from "better-sqlite3";

import type { NewSkillAreaInput, SkillArea } from "../../domain/types.js";
import type { SkillAreaRepository } from "../../ports/skill-area-repository.js";

interface SkillAreaRow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

function rowToSkillArea(row: SkillAreaRow): SkillArea {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteSkillAreaRepository implements SkillAreaRepository {
  constructor(private readonly db: Database.Database) {}

  getById(id: string): SkillArea | undefined {
    const row = this.db.prepare("SELECT * FROM skill_areas WHERE id = ?").get(id) as
      | SkillAreaRow
      | undefined;
    return row ? rowToSkillArea(row) : undefined;
  }

  getAll(): SkillArea[] {
    return (this.db.prepare("SELECT * FROM skill_areas ORDER BY name").all() as SkillAreaRow[]).map(
      rowToSkillArea,
    );
  }

  getByName(name: string): SkillArea | undefined {
    const row = this.db.prepare("SELECT * FROM skill_areas WHERE name = ?").get(name) as
      | SkillAreaRow
      | undefined;
    return row ? rowToSkillArea(row) : undefined;
  }

  create(id: string, input: NewSkillAreaInput): SkillArea {
    const now = new Date().toISOString();
    this.db
      .prepare("INSERT INTO skill_areas (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)")
      .run(id, input.name, now, now);
    return this.getById(id) as SkillArea;
  }

  update(id: string, patch: Partial<NewSkillAreaInput>): SkillArea | undefined {
    const existing = this.getById(id);
    if (!existing) return undefined;
    if (patch.name === undefined) return existing;
    this.db
      .prepare("UPDATE skill_areas SET name = ?, updated_at = ? WHERE id = ?")
      .run(patch.name, new Date().toISOString(), id);
    return this.getById(id);
  }

  delete(id: string): boolean {
    const result = this.db.prepare("DELETE FROM skill_areas WHERE id = ?").run(id);
    return result.changes > 0;
  }
}
