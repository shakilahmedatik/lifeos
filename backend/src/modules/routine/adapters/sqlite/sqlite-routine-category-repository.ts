import { and, asc, count, eq, isNull, or, sql } from "drizzle-orm";

import type { DrizzleClient } from "../../../../shared/db.js";
import { routineCategories, tasks } from "../../../../shared/schema.js";
import type {
  NewRoutineCategoryInput,
  RoutineCategory,
  UpdateRoutineCategoryInput,
} from "../../domain/types.js";
import type { RoutineCategoryRepository } from "../../ports/routine-category-repository.js";

function rowToCategory(row: typeof routineCategories.$inferSelect): RoutineCategory {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon ?? undefined,
    isDefault: row.isDefault === 1,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const DEFAULT_ROUTINE_CATEGORIES: Array<{
  id: string;
  name: string;
  color: string;
  icon: string;
  sortOrder: number;
}> = [
  { id: "routine", name: "Routine", color: "#14b8a6", icon: "Clock", sortOrder: 0 },
  { id: "must_do", name: "Must Do", color: "#dc2626", icon: "AlertCircle", sortOrder: 1 },
  { id: "work", name: "Work", color: "#3b82f6", icon: "Briefcase", sortOrder: 2 },
  { id: "workout", name: "Workout", color: "#ef4444", icon: "Dumbbell", sortOrder: 3 },
  { id: "learning", name: "Learning", color: "#a855f7", icon: "BookOpen", sortOrder: 4 },
  { id: "habit", name: "Habit", color: "#f97316", icon: "Flame", sortOrder: 5 },
  { id: "personal", name: "Personal", color: "#ec4899", icon: "User", sortOrder: 6 },
  { id: "flex", name: "Flex", color: "#6366f1", icon: "Shuffle", sortOrder: 7 },
  { id: "general", name: "General", color: "#6b7280", icon: "CheckSquare", sortOrder: 8 },
];

function userScope(userId: string) {
  return and(
    or(
      eq(routineCategories.userId, userId),
      eq(routineCategories.userId, ""),
      sql`${routineCategories.userId} IS NULL`,
    ),
    isNull(routineCategories.deletedAt),
  );
}

export class DrizzleRoutineCategoryRepository implements RoutineCategoryRepository {
  constructor(private readonly db: DrizzleClient) {}

  private async ensureDefaults(userId: string): Promise<void> {
    const [result] = await this.db
      .select({ count: count() })
      .from(routineCategories)
      .where(userScope(userId));

    if ((result?.count ?? 0) === 0) {
      const now = new Date().toISOString();
      for (const cat of DEFAULT_ROUTINE_CATEGORIES) {
        await this.db
          .insert(routineCategories)
          .values({
            id: cat.id,
            userId,
            name: cat.name,
            color: cat.color,
            icon: cat.icon,
            isDefault: 1,
            sortOrder: cat.sortOrder,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoNothing();
      }
    }
  }

  async getById(id: string, userId: string): Promise<RoutineCategory | undefined> {
    await this.ensureDefaults(userId);
    const [row] = await this.db
      .select()
      .from(routineCategories)
      .where(and(eq(routineCategories.id, id), userScope(userId)));
    return row ? rowToCategory(row) : undefined;
  }

  async getAll(userId: string): Promise<RoutineCategory[]> {
    await this.ensureDefaults(userId);
    const rows = await this.db
      .select()
      .from(routineCategories)
      .where(userScope(userId))
      .orderBy(asc(routineCategories.sortOrder), asc(routineCategories.createdAt));
    return rows.map(rowToCategory);
  }

  async create(
    id: string,
    input: NewRoutineCategoryInput,
    userId: string,
  ): Promise<RoutineCategory> {
    await this.ensureDefaults(userId);
    const now = new Date().toISOString();

    await this.db.insert(routineCategories).values({
      id,
      userId,
      name: input.name,
      color: input.color || "#3b82f6",
      icon: input.icon ?? null,
      isDefault: 0,
      sortOrder: input.sortOrder ?? 100,
      createdAt: now,
      updatedAt: now,
    });

    const created = await this.getById(id, userId);
    if (!created) {
      throw new Error("Failed to retrieve created routine category");
    }
    return created;
  }

  async update(
    id: string,
    patch: UpdateRoutineCategoryInput,
    userId: string,
  ): Promise<RoutineCategory | undefined> {
    const existing = await this.getById(id, userId);
    if (!existing) return undefined;

    const updates: Record<string, unknown> = {};
    if (patch.name !== undefined) updates.name = patch.name;
    if (patch.color !== undefined) updates.color = patch.color;
    if (patch.icon !== undefined) updates.icon = patch.icon ?? null;
    if (patch.sortOrder !== undefined) updates.sortOrder = patch.sortOrder;

    if (Object.keys(updates).length === 0) return existing;

    updates.updatedAt = new Date().toISOString();

    await this.db
      .update(routineCategories)
      .set(updates)
      .where(and(eq(routineCategories.id, id), userScope(userId)));

    return await this.getById(id, userId);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const now = new Date().toISOString();
    const result = await this.db
      .update(routineCategories)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(routineCategories.id, id), userScope(userId)));
    return result.rowsAffected > 0;
  }

  async countTasksByCategoryId(categoryId: string, userId: string): Promise<number> {
    const cat = await this.getById(categoryId, userId);
    const catName = cat ? cat.name.toLowerCase() : "";

    const [result] = await this.db
      .select({ count: count() })
      .from(tasks)
      .where(
        and(
          or(eq(tasks.category, categoryId), sql`lower(${tasks.category}) = ${catName}`),
          or(eq(tasks.userId, userId), eq(tasks.userId, ""), sql`${tasks.userId} IS NULL`),
        ),
      );
    return result?.count ?? 0;
  }

  async reassignTasksCategory(
    fromCategoryId: string,
    toCategoryId: string,
    userId: string,
  ): Promise<number> {
    const cat = await this.getById(fromCategoryId, userId);
    const catName = cat ? cat.name.toLowerCase() : "";

    const result = await this.db
      .update(tasks)
      .set({ category: toCategoryId, updatedAt: new Date().toISOString() })
      .where(
        and(
          or(eq(tasks.category, fromCategoryId), sql`lower(${tasks.category}) = ${catName}`),
          or(eq(tasks.userId, userId), eq(tasks.userId, ""), sql`${tasks.userId} IS NULL`),
        ),
      );
    return result.rowsAffected;
  }
}
