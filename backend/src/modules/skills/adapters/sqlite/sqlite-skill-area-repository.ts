import { and, asc, eq, isNull, or } from "drizzle-orm";

import type { DrizzleClient } from "../../../../shared/db.js";
import { skillAreas } from "../../../../shared/schema.js";
import type { NewSkillAreaInput, SkillArea } from "../../domain/types.js";
import type { SkillAreaRepository } from "../../ports/skill-area-repository.js";

function rowToSkillArea(row: typeof skillAreas.$inferSelect): SkillArea {
  return {
    id: row.id,
    name: row.name,
    weeklyGoalHours: row.weeklyGoalHours ?? 5,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function userScope(userId: string) {
  return and(
    or(eq(skillAreas.userId, userId), eq(skillAreas.userId, "")),
    isNull(skillAreas.deletedAt),
  );
}

export class DrizzleSkillAreaRepository implements SkillAreaRepository {
  constructor(private readonly db: DrizzleClient) {}

  async getById(id: string, userId = "default"): Promise<SkillArea | undefined> {
    const [row] = await this.db
      .select()
      .from(skillAreas)
      .where(and(eq(skillAreas.id, id), userScope(userId)));
    return row ? rowToSkillArea(row) : undefined;
  }

  async getAll(userId = "default"): Promise<SkillArea[]> {
    const rows = await this.db
      .select()
      .from(skillAreas)
      .where(userScope(userId))
      .orderBy(asc(skillAreas.name));
    return rows.map(rowToSkillArea);
  }

  async getByName(name: string, userId = "default"): Promise<SkillArea | undefined> {
    const [row] = await this.db
      .select()
      .from(skillAreas)
      .where(and(eq(skillAreas.name, name), userScope(userId)));
    return row ? rowToSkillArea(row) : undefined;
  }

  async create(id: string, input: NewSkillAreaInput, userId = "default"): Promise<SkillArea> {
    const now = new Date().toISOString();
    await this.db.insert(skillAreas).values({
      id,
      userId,
      name: input.name,
      weeklyGoalHours: input.weeklyGoalHours ?? 5,
      createdAt: now,
      updatedAt: now,
    });
    return (await this.getById(id, userId)) as SkillArea;
  }

  async update(
    id: string,
    patch: Partial<NewSkillAreaInput>,
    userId = "default",
  ): Promise<SkillArea | undefined> {
    const existing = await this.getById(id, userId);
    if (!existing) return undefined;

    const updates: Record<string, unknown> = {};
    if (patch.name !== undefined) updates.name = patch.name;
    if (patch.weeklyGoalHours !== undefined) updates.weeklyGoalHours = patch.weeklyGoalHours;

    updates.updatedAt = new Date().toISOString();

    await this.db
      .update(skillAreas)
      .set(updates)
      .where(and(eq(skillAreas.id, id), userScope(userId)));
    return await this.getById(id, userId);
  }

  async delete(id: string, userId = "default"): Promise<boolean> {
    const now = new Date().toISOString();
    const result = await this.db
      .update(skillAreas)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(skillAreas.id, id), userScope(userId)));
    return result.rowsAffected > 0;
  }
}
