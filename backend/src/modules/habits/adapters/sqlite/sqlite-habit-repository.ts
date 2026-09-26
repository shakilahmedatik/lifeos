import { and, asc, desc, eq, isNull, or, sql } from "drizzle-orm";

import type { DrizzleClient } from "../../../../shared/db.js";
import { habits } from "../../../../shared/schema.js";
import type {
  HabitCategory,
  HabitConfig,
  HabitDefinition,
  HabitType,
  NewHabitDefinitionInput,
  UpdateHabitDefinitionInput,
} from "../../domain/types.js";
import type { HabitRepository } from "../../ports/habit-repository.js";

function rowToHabit(row: typeof habits.$inferSelect): HabitDefinition {
  let config: HabitConfig;
  try {
    config = JSON.parse(row.config);
  } catch {
    config = { type: "boolean" };
  }
  return {
    id: row.id,
    name: row.name,
    type: (row.type || "boolean") as HabitType,
    category: (row.category || "general") as HabitCategory,
    icon: row.icon || undefined,
    color: row.color || undefined,
    config: config && typeof config === "object" ? config : { type: "boolean" },
    archived: Boolean(row.archived),
    sortOrder: row.sortOrder ?? 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt || row.createdAt,
  };
}

function userScope(userId: string) {
  return and(or(eq(habits.userId, userId), eq(habits.userId, "")), isNull(habits.deletedAt));
}

export class DrizzleHabitRepository implements HabitRepository {
  constructor(private readonly db: DrizzleClient) {}

  async getById(id: string, userId: string): Promise<HabitDefinition | undefined> {
    const [row] = await this.db
      .select()
      .from(habits)
      .where(and(eq(habits.id, id), userScope(userId)));
    return row ? rowToHabit(row) : undefined;
  }

  async getByName(name: string, userId: string): Promise<HabitDefinition | undefined> {
    const [row] = await this.db
      .select()
      .from(habits)
      .where(and(sql`LOWER(${habits.name}) = LOWER(${name})`, userScope(userId)));
    return row ? rowToHabit(row) : undefined;
  }

  async getAll(includeArchived = false, userId: string): Promise<HabitDefinition[]> {
    const conditions = [userScope(userId)];
    if (!includeArchived) {
      conditions.push(eq(habits.archived, 0));
    }

    const rows = await this.db
      .select()
      .from(habits)
      .where(and(...conditions))
      .orderBy(asc(habits.sortOrder), desc(sql`${habits.createdAt}`));
    return rows.map(rowToHabit);
  }

  async create(
    id: string,
    input: NewHabitDefinitionInput,
    sortOrder: number,
    userId: string,
  ): Promise<HabitDefinition> {
    const now = new Date().toISOString();

    await this.db.insert(habits).values({
      id,
      userId,
      name: input.name,
      type: input.type,
      category: input.category ?? "general",
      icon: input.icon ?? null,
      color: input.color ?? null,
      config: JSON.stringify(input.config),
      archived: 0,
      sortOrder,
      createdAt: now,
      updatedAt: now,
    });

    return (await this.getById(id, userId)) as HabitDefinition;
  }

  async update(
    id: string,
    patch: UpdateHabitDefinitionInput,
    userId: string,
  ): Promise<HabitDefinition | undefined> {
    const existing = await this.getById(id, userId);
    if (!existing) return undefined;

    const updates: Record<string, unknown> = {};
    if (patch.name !== undefined) updates.name = patch.name;
    if (patch.category !== undefined) updates.category = patch.category;
    if (patch.icon !== undefined) updates.icon = patch.icon ?? null;
    if (patch.color !== undefined) updates.color = patch.color ?? null;
    if (patch.config !== undefined) updates.config = JSON.stringify(patch.config);
    const p = patch as Record<string, unknown>;
    if (p.archived !== undefined) updates.archived = p.archived ? 1 : 0;
    if (p.sortOrder !== undefined) updates.sortOrder = p.sortOrder as number;

    if (Object.keys(updates).length === 0) return existing;

    updates.updatedAt = new Date().toISOString();

    await this.db
      .update(habits)
      .set(updates)
      .where(and(eq(habits.id, id), userScope(userId)));

    return await this.getById(id, userId);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const now = new Date().toISOString();
    const result = await this.db
      .update(habits)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(habits.id, id), userScope(userId)));
    return result.rowsAffected > 0;
  }

  async archive(id: string, archived: boolean, userId: string): Promise<void> {
    await this.db
      .update(habits)
      .set({ archived: archived ? 1 : 0, updatedAt: new Date().toISOString() })
      .where(and(eq(habits.id, id), userScope(userId)));
  }

  async updateSortOrders(
    updates: { id: string; sortOrder: number }[],
    userId: string,
  ): Promise<void> {
    const now = new Date().toISOString();
    for (const update of updates) {
      await this.db
        .update(habits)
        .set({ sortOrder: update.sortOrder, updatedAt: now })
        .where(and(eq(habits.id, update.id), userScope(userId)));
    }
  }
}
