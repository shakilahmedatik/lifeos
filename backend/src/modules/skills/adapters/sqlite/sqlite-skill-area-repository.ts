import type { Client } from "@libsql/client";

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
  constructor(private readonly client: Client) {}

  async getById(id: string): Promise<SkillArea | undefined> {
    const res = await this.client.execute({
      sql: "SELECT * FROM skill_areas WHERE id = ?",
      args: [id],
    });
    const row = res.rows[0] as unknown as SkillAreaRow | undefined;
    return row ? rowToSkillArea(row) : undefined;
  }

  async getAll(): Promise<SkillArea[]> {
    const res = await this.client.execute("SELECT * FROM skill_areas ORDER BY name");
    const rows = res.rows as unknown as SkillAreaRow[];
    return rows.map(rowToSkillArea);
  }

  async getByName(name: string): Promise<SkillArea | undefined> {
    const res = await this.client.execute({
      sql: "SELECT * FROM skill_areas WHERE name = ?",
      args: [name],
    });
    const row = res.rows[0] as unknown as SkillAreaRow | undefined;
    return row ? rowToSkillArea(row) : undefined;
  }

  async create(id: string, input: NewSkillAreaInput): Promise<SkillArea> {
    const now = new Date().toISOString();
    const weeklyGoalHours = input.weeklyGoalHours ?? 5;
    const category = (input as { category?: string }).category;
    if (category) {
      await this.client.execute({
        sql: "INSERT INTO skill_areas (id, name, category, weekly_goal_hours, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        args: [id, input.name, category, weeklyGoalHours, now, now],
      });
    } else {
      await this.client.execute({
        sql: "INSERT INTO skill_areas (id, name, weekly_goal_hours, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        args: [id, input.name, weeklyGoalHours, now, now],
      });
    }
    return (await this.getById(id)) as SkillArea;
  }

  async update(id: string, patch: Partial<NewSkillAreaInput>): Promise<SkillArea | undefined> {
    const existing = await this.getById(id);
    if (!existing) return undefined;
    const name = patch.name ?? existing.name;
    const weeklyGoalHours = patch.weeklyGoalHours ?? existing.weeklyGoalHours;
    await this.client.execute({
      sql: "UPDATE skill_areas SET name = ?, weekly_goal_hours = ?, updated_at = ? WHERE id = ?",
      args: [name, weeklyGoalHours, new Date().toISOString(), id],
    });
    return await this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.client.execute({
      sql: "DELETE FROM skill_areas WHERE id = ?",
      args: [id],
    });
    return res.rowsAffected > 0;
  }
}
