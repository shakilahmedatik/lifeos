import { DEFAULT_FINANCE_CATEGORIES } from "@lifeos/contracts";
import { and, asc, desc, eq, isNull, or, sql } from "drizzle-orm";
import type { DrizzleClient } from "../../../../shared/db.js";
import { categories } from "../../../../shared/schema.js";
import type { Category, NewCategoryInput } from "../../domain/types.js";
import type { CategoryRepository } from "../../ports/category-repository.js";

function rowToCategory(row: typeof categories.$inferSelect): Category {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind as Category["kind"],
    isSystem: Boolean(row.isSystem),
    archived: Boolean(row.archived),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function userScope(userId: string) {
  return and(
    or(eq(categories.userId, userId), eq(categories.userId, "")),
    isNull(categories.deletedAt),
  );
}

export class DrizzleCategoryRepository implements CategoryRepository {
  constructor(private readonly db: DrizzleClient) {}

  private async ensureDefaults(): Promise<void> {
    const now = new Date().toISOString();
    for (const cat of DEFAULT_FINANCE_CATEGORIES) {
      const existing = await this.db
        .select({ id: categories.id, isSystem: categories.isSystem })
        .from(categories)
        .where(
          and(
            or(eq(categories.id, cat.id), sql`lower(${categories.name}) = lower(${cat.name})`),
            eq(categories.userId, ""),
          ),
        );

      if (existing.length === 0) {
        await this.db
          .insert(categories)
          .values({
            id: cat.id,
            userId: "",
            name: cat.name,
            kind: cat.kind,
            isSystem: 1,
            archived: 0,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoNothing();
      } else {
        const row = existing[0];
        if (!row.isSystem) {
          await this.db
            .update(categories)
            .set({ isSystem: 1, updatedAt: now })
            .where(and(eq(categories.id, row.id), eq(categories.userId, "")));
        }
      }
    }
  }

  async getById(id: string, userId: string): Promise<Category | undefined> {
    await this.ensureDefaults();
    const [row] = await this.db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), userScope(userId)));
    return row ? rowToCategory(row) : undefined;
  }

  async getAll(userId: string): Promise<Category[]> {
    await this.ensureDefaults();
    const rows = await this.db
      .select()
      .from(categories)
      .where(userScope(userId))
      .orderBy(desc(categories.isSystem), asc(categories.kind), asc(categories.name));
    return rows.map(rowToCategory);
  }

  async getActive(userId: string): Promise<Category[]> {
    await this.ensureDefaults();
    const rows = await this.db
      .select()
      .from(categories)
      .where(and(eq(categories.archived, 0), userScope(userId)))
      .orderBy(desc(categories.isSystem), asc(categories.kind), asc(categories.name));
    return rows.map(rowToCategory);
  }

  async getByKind(kind: Category["kind"], userId: string): Promise<Category[]> {
    await this.ensureDefaults();
    const rows = await this.db
      .select()
      .from(categories)
      .where(and(eq(categories.kind, kind), eq(categories.archived, 0), userScope(userId)))
      .orderBy(desc(categories.isSystem), asc(categories.name));
    return rows.map(rowToCategory);
  }

  async create(id: string, input: NewCategoryInput, userId: string): Promise<Category> {
    await this.ensureDefaults();
    const now = new Date().toISOString();
    await this.db.insert(categories).values({
      id,
      userId,
      name: input.name,
      kind: input.kind,
      isSystem: input.isSystem ? 1 : 0,
      archived: 0,
      createdAt: now,
      updatedAt: now,
    });

    return (await this.getById(id, userId)) as Category;
  }

  async update(
    id: string,
    patch: Partial<NewCategoryInput>,
    userId: string,
  ): Promise<Category | undefined> {
    await this.ensureDefaults();
    const existing = await this.getById(id, userId);
    if (!existing) return undefined;

    const updates: Record<string, unknown> = {};
    if (patch.name !== undefined) updates.name = patch.name;
    if (patch.kind !== undefined) updates.kind = patch.kind;

    if (Object.keys(updates).length === 0) return existing;

    updates.updatedAt = new Date().toISOString();

    await this.db
      .update(categories)
      .set(updates)
      .where(and(eq(categories.id, id), userScope(userId)));

    return await this.getById(id, userId);
  }

  async archive(id: string, userId: string): Promise<boolean> {
    await this.ensureDefaults();
    const result = await this.db
      .update(categories)
      .set({ archived: 1, updatedAt: new Date().toISOString() })
      .where(and(eq(categories.id, id), eq(categories.isSystem, 0), userScope(userId)));
    return result.rowsAffected > 0;
  }

  async unarchive(id: string, userId: string): Promise<boolean> {
    await this.ensureDefaults();
    const result = await this.db
      .update(categories)
      .set({ archived: 0, updatedAt: new Date().toISOString() })
      .where(and(eq(categories.id, id), userScope(userId)));
    return result.rowsAffected > 0;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    await this.ensureDefaults();
    const now = new Date().toISOString();
    const result = await this.db
      .update(categories)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(categories.id, id), eq(categories.isSystem, 0), userScope(userId)));
    return result.rowsAffected > 0;
  }
}
