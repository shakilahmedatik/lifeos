import { and, asc, eq, isNull, or } from "drizzle-orm";

import type { DrizzleClient } from "../../../../shared/db.js";
import { learningResources } from "../../../../shared/schema.js";
import type { LearningResource, NewLearningResourceInput } from "../../domain/types.js";
import type { LearningResourceRepository } from "../../ports/learning-resource-repository.js";

function rowToResource(row: typeof learningResources.$inferSelect): LearningResource {
  return {
    id: row.id,
    skillAreaId: row.skillAreaId,
    title: row.title,
    type: row.type as LearningResource["type"],
    totalUnits: row.totalUnits ?? undefined,
    unit: row.unit as LearningResource["unit"] | undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function userScope(userId: string) {
  return and(
    or(eq(learningResources.userId, userId), eq(learningResources.userId, "")),
    isNull(learningResources.deletedAt),
  );
}

export class DrizzleLearningResourceRepository implements LearningResourceRepository {
  constructor(private readonly db: DrizzleClient) {}

  async getById(id: string, userId = "default"): Promise<LearningResource | undefined> {
    const [row] = await this.db
      .select()
      .from(learningResources)
      .where(and(eq(learningResources.id, id), userScope(userId)));
    return row ? rowToResource(row) : undefined;
  }

  async getBySkillArea(skillAreaId: string, userId = "default"): Promise<LearningResource[]> {
    const rows = await this.db
      .select()
      .from(learningResources)
      .where(and(eq(learningResources.skillAreaId, skillAreaId), userScope(userId)))
      .orderBy(asc(learningResources.title));
    return rows.map(rowToResource);
  }

  async getAll(userId = "default"): Promise<LearningResource[]> {
    const rows = await this.db
      .select()
      .from(learningResources)
      .where(userScope(userId))
      .orderBy(asc(learningResources.title));
    return rows.map(rowToResource);
  }

  async create(
    id: string,
    input: NewLearningResourceInput,
    userId = "default",
  ): Promise<LearningResource> {
    const now = new Date().toISOString();
    await this.db.insert(learningResources).values({
      id,
      userId,
      skillAreaId: input.skillAreaId,
      title: input.title,
      type: input.type,
      totalUnits: input.totalUnits ?? null,
      unit: input.unit ?? null,
      createdAt: now,
      updatedAt: now,
    });
    return (await this.getById(id, userId)) as LearningResource;
  }

  async update(
    id: string,
    patch: Partial<NewLearningResourceInput>,
    userId = "default",
  ): Promise<LearningResource | undefined> {
    const existing = await this.getById(id, userId);
    if (!existing) return undefined;

    const updates: Record<string, unknown> = {};
    if (patch.title !== undefined) updates.title = patch.title;
    if (patch.type !== undefined) updates.type = patch.type;
    if (patch.skillAreaId !== undefined) updates.skillAreaId = patch.skillAreaId;
    if (patch.totalUnits !== undefined) updates.totalUnits = patch.totalUnits;
    if (patch.unit !== undefined) updates.unit = patch.unit;

    if (Object.keys(updates).length === 0) return existing;

    updates.updatedAt = new Date().toISOString();

    await this.db
      .update(learningResources)
      .set(updates)
      .where(and(eq(learningResources.id, id), userScope(userId)));
    return await this.getById(id, userId);
  }

  async delete(id: string, userId = "default"): Promise<boolean> {
    const now = new Date().toISOString();
    const result = await this.db
      .update(learningResources)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(learningResources.id, id), userScope(userId)));
    return result.rowsAffected > 0;
  }
}
