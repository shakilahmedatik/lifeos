import type { Client } from "@libsql/client";
import type {
  NewRoutineCategoryInput,
  RoutineCategory,
  UpdateRoutineCategoryInput,
} from "../../domain/types.js";
import type { RoutineCategoryRepository } from "../../ports/routine-category-repository.js";

interface CategoryRow {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string | null;
  is_default: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

function rowToCategory(row: CategoryRow): RoutineCategory {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon ?? undefined,
    isDefault: row.is_default === 1,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

export class SqliteRoutineCategoryRepository implements RoutineCategoryRepository {
  constructor(private readonly client: Client) {}

  private async ensureDefaults(userId: string): Promise<void> {
    const res = await this.client.execute({
      sql: "SELECT COUNT(*) as count FROM routine_categories WHERE (user_id = ? OR user_id = '' OR user_id IS NULL) AND deleted_at IS NULL",
      args: [userId],
    });
    const count = Number(res.rows[0]?.count ?? 0);
    if (count === 0) {
      const now = new Date().toISOString();
      for (const cat of DEFAULT_ROUTINE_CATEGORIES) {
        await this.client.execute({
          sql: `INSERT OR IGNORE INTO routine_categories (id, user_id, name, color, icon, is_default, sort_order, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`,
          args: [cat.id, userId, cat.name, cat.color, cat.icon, cat.sortOrder, now, now],
        });
      }
    }
  }

  async getById(id: string, userId: string): Promise<RoutineCategory | undefined> {
    await this.ensureDefaults(userId);
    const res = await this.client.execute({
      sql: "SELECT * FROM routine_categories WHERE id = ? AND (user_id = ? OR user_id = '' OR user_id IS NULL) AND deleted_at IS NULL",
      args: [id, userId],
    });
    const row = res.rows[0] as unknown as CategoryRow | undefined;
    return row ? rowToCategory(row) : undefined;
  }

  async getAll(userId: string): Promise<RoutineCategory[]> {
    await this.ensureDefaults(userId);
    const res = await this.client.execute({
      sql: "SELECT * FROM routine_categories WHERE (user_id = ? OR user_id = '' OR user_id IS NULL) AND deleted_at IS NULL ORDER BY sort_order ASC, created_at ASC",
      args: [userId],
    });
    const rows = res.rows as unknown as CategoryRow[];
    return rows.map((r) => rowToCategory(r));
  }

  async create(
    id: string,
    input: NewRoutineCategoryInput,
    userId: string,
  ): Promise<RoutineCategory> {
    await this.ensureDefaults(userId);
    const now = new Date().toISOString();
    const color = input.color || "#3b82f6";
    const sortOrder = input.sortOrder ?? 100;

    await this.client.execute({
      sql: `INSERT INTO routine_categories (id, user_id, name, color, icon, is_default, sort_order, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      args: [id, userId, input.name, color, input.icon ?? null, sortOrder, now, now],
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

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (patch.name !== undefined) {
      fields.push("name = ?");
      values.push(patch.name);
    }
    if (patch.color !== undefined) {
      fields.push("color = ?");
      values.push(patch.color);
    }
    if (patch.icon !== undefined) {
      fields.push("icon = ?");
      values.push(patch.icon ?? null);
    }
    if (patch.sortOrder !== undefined) {
      fields.push("sort_order = ?");
      values.push(patch.sortOrder);
    }

    if (fields.length === 0) return existing;

    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);
    values.push(userId);

    await this.client.execute({
      sql: `UPDATE routine_categories SET ${fields.join(", ")} WHERE id = ? AND (user_id = ? OR user_id = '' OR user_id IS NULL)`,
      args: values,
    });

    return await this.getById(id, userId);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const now = new Date().toISOString();
    const res = await this.client.execute({
      sql: "UPDATE routine_categories SET deleted_at = ?, updated_at = ? WHERE id = ? AND (user_id = ? OR user_id = '' OR user_id IS NULL)",
      args: [now, now, id, userId],
    });
    return res.rowsAffected > 0;
  }

  async countTasksByCategoryId(categoryId: string, userId: string): Promise<number> {
    // Check both by category ID and by matching name (in case legacy tasks store standard name)
    const cat = await this.getById(categoryId, userId);
    const catName = cat ? cat.name.toLowerCase() : "";

    const res = await this.client.execute({
      sql: `SELECT COUNT(*) as count FROM tasks 
            WHERE (category = ? OR lower(category) = ?) 
            AND (user_id = ? OR user_id = '' OR user_id IS NULL)`,
      args: [categoryId, catName, userId],
    });
    return Number(res.rows[0]?.count ?? 0);
  }

  async reassignTasksCategory(
    fromCategoryId: string,
    toCategoryId: string,
    userId: string,
  ): Promise<number> {
    const cat = await this.getById(fromCategoryId, userId);
    const catName = cat ? cat.name.toLowerCase() : "";

    const res = await this.client.execute({
      sql: `UPDATE tasks SET category = ?, updated_at = ? 
            WHERE (category = ? OR lower(category) = ?) 
            AND (user_id = ? OR user_id = '' OR user_id IS NULL)`,
      args: [toCategoryId, new Date().toISOString(), fromCategoryId, catName, userId],
    });
    return res.rowsAffected;
  }
}
