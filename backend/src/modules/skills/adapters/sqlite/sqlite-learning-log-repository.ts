import { and, asc, desc, eq, gte, inArray, isNull, lte, or } from "drizzle-orm";

import type { DrizzleClient } from "../../../../shared/db.js";
import { learningLogs } from "../../../../shared/schema.js";
import type { LearningLog, NewLearningLogInput } from "../../domain/types.js";
import type { LearningLogRepository } from "../../ports/learning-log-repository.js";

function rowToLog(row: typeof learningLogs.$inferSelect): LearningLog {
  return {
    id: row.id,
    resourceId: row.resourceId,
    date: row.date,
    minutesSpent: row.minutesSpent,
    unitsCompleted: row.unitsCompleted ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function userScope(userId: string) {
  return and(
    or(eq(learningLogs.userId, userId), eq(learningLogs.userId, "")),
    isNull(learningLogs.deletedAt),
  );
}

export class DrizzleLearningLogRepository implements LearningLogRepository {
  constructor(private readonly db: DrizzleClient) {}

  async getById(id: string, userId = "default"): Promise<LearningLog | undefined> {
    const [row] = await this.db
      .select()
      .from(learningLogs)
      .where(and(eq(learningLogs.id, id), userScope(userId)));
    return row ? rowToLog(row) : undefined;
  }

  async getByResourceId(resourceId: string, userId = "default"): Promise<LearningLog[]> {
    const rows = await this.db
      .select()
      .from(learningLogs)
      .where(and(eq(learningLogs.resourceId, resourceId), userScope(userId)))
      .orderBy(desc(learningLogs.date));
    return rows.map(rowToLog);
  }

  async getByResourceIds(
    resourceIds: string[],
    startDate?: string,
    endDate?: string,
    userId = "default",
  ): Promise<LearningLog[]> {
    if (resourceIds.length === 0) return [];

    const conditions = [inArray(learningLogs.resourceId, resourceIds), userScope(userId)];
    if (startDate) conditions.push(gte(learningLogs.date, startDate));
    if (endDate) conditions.push(lte(learningLogs.date, endDate));

    const rows = await this.db
      .select()
      .from(learningLogs)
      .where(and(...conditions))
      .orderBy(asc(learningLogs.date));
    return rows.map(rowToLog);
  }

  async getByDateRange(
    startDate: string,
    endDate: string,
    userId = "default",
  ): Promise<LearningLog[]> {
    const rows = await this.db
      .select()
      .from(learningLogs)
      .where(
        and(gte(learningLogs.date, startDate), lte(learningLogs.date, endDate), userScope(userId)),
      )
      .orderBy(asc(learningLogs.date));
    return rows.map(rowToLog);
  }

  async create(id: string, input: NewLearningLogInput, userId = "default"): Promise<LearningLog> {
    const now = new Date().toISOString();
    await this.db.insert(learningLogs).values({
      id,
      userId,
      resourceId: input.resourceId,
      date: input.date,
      minutesSpent: input.minutesSpent,
      unitsCompleted: input.unitsCompleted ?? null,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
    });
    return (await this.getById(id, userId)) as LearningLog;
  }

  async update(
    id: string,
    patch: Partial<NewLearningLogInput>,
    userId = "default",
  ): Promise<LearningLog | undefined> {
    const existing = await this.getById(id, userId);
    if (!existing) return undefined;

    const updates: Record<string, unknown> = {};
    if (patch.date !== undefined) updates.date = patch.date;
    if (patch.minutesSpent !== undefined) updates.minutesSpent = patch.minutesSpent;
    if (patch.unitsCompleted !== undefined) updates.unitsCompleted = patch.unitsCompleted ?? null;
    if (patch.notes !== undefined) updates.notes = patch.notes ?? null;

    if (Object.keys(updates).length === 0) return existing;

    updates.updatedAt = new Date().toISOString();

    await this.db
      .update(learningLogs)
      .set(updates)
      .where(and(eq(learningLogs.id, id), userScope(userId)));
    return await this.getById(id, userId);
  }

  async delete(id: string, userId = "default"): Promise<boolean> {
    const now = new Date().toISOString();
    const result = await this.db
      .update(learningLogs)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(learningLogs.id, id), userScope(userId)));
    return result.rowsAffected > 0;
  }
}
