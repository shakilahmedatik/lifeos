import type Database from "better-sqlite3";

import type { NewSkillAreaInput, SkillArea } from "../../domain/types.js";
import type { SkillAreaRepository } from "../../ports/skill-area-repository.js";

interface SkillAreaRow {
  id: string;
  name: string;
  weekly_goal_hours: number;
  created_at: string;
  updated_at: string;
}

function rowToSkillArea(row: SkillAreaRow): SkillArea {
  return {
    id: row.id,
    name: row.name,
    weeklyGoalHours: row.weekly_goal_hours ?? 5,
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
    const weeklyGoalHours = input.weeklyGoalHours ?? 5;
    this.db
      .prepare(
        "INSERT INTO skill_areas (id, name, weekly_goal_hours, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      )
      .run(id, input.name, weeklyGoalHours, now, now);
    return this.getById(id) as SkillArea;
  }

  update(id: string, patch: Partial<NewSkillAreaInput>): SkillArea | undefined {
    const existing = this.getById(id);
    if (!existing) return undefined;
    const name = patch.name ?? existing.name;
    const weeklyGoalHours = patch.weeklyGoalHours ?? existing.weeklyGoalHours;
    this.db
      .prepare(
        "UPDATE skill_areas SET name = ?, weekly_goal_hours = ?, updated_at = ? WHERE id = ?",
      )
      .run(name, weeklyGoalHours, new Date().toISOString(), id);
    return this.getById(id);
  }

  delete(id: string): boolean {
    const result = this.db.prepare("DELETE FROM skill_areas WHERE id = ?").run(id);
    return result.changes > 0;
  }
}
