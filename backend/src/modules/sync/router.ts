import { sql } from "drizzle-orm";
import { Router } from "express";
import type { DrizzleClient } from "../../shared/db.js";

const TABLES_WITH_USER_ID = new Set([
  "settings",
  "tasks",
  "routine_categories",
  "habits",
  "habit_logs",
  "exercises",
  "workouts",
  "workout_sessions",
  "accounts",
  "categories",
  "transactions",
  "skill_areas",
  "learning_resources",
  "learning_logs",
]);

const SYNCABLE_TABLES = [
  "tasks",
  "routine_categories",
  "habits",
  "habit_logs",
  "exercises",
  "workouts",
  "workout_exercises",
  "workout_sessions",
  "exercise_logs",
  "accounts",
  "categories",
  "transactions",
  "skill_areas",
  "learning_resources",
  "learning_logs",
  "settings",
] as const;

const TABLE_TIMESTAMP_COLUMN: Record<string, string> = {
  tasks: "updated_at",
  routine_categories: "updated_at",
  habits: "updated_at",
  habit_logs: "logged_at",
  exercises: "updated_at",
  workouts: "updated_at",
  workout_exercises: "created_at",
  workout_sessions: "created_at",
  exercise_logs: "completed_at",
  accounts: "updated_at",
  categories: "updated_at",
  transactions: "updated_at",
  skill_areas: "updated_at",
  learning_resources: "updated_at",
  learning_logs: "updated_at",
  settings: "updated_at",
};

export function createSyncRouter(db: DrizzleClient): Router {
  const router = Router();
  const tableColumnsCache = new Map<string, Set<string>>();

  async function getTableColumns(table: string): Promise<Set<string>> {
    const cached = tableColumnsCache.get(table);
    if (cached) {
      return cached;
    }
    try {
      const res = await db.all<{ name: string }>(sql.raw(`PRAGMA table_info(${table})`));
      const cols = new Set(res.map((r) => r.name));
      tableColumnsCache.set(table, cols);
      return cols;
    } catch {
      return new Set();
    }
  }

  router.post("/", async (req, res, next) => {
    try {
      const userId = (req as unknown as { user: { id: string } }).user?.id || "";
      const { lastSyncAt, changes, forceFull } = req.body || {};
      const shouldFilterByTime = Boolean(lastSyncAt) && !forceFull;

      // 1. Apply incoming client changes in topological order (Last-write-wins)
      if (changes && typeof changes === "object") {
        for (const table of SYNCABLE_TABLES) {
          const rows = (changes as Record<string, unknown[]>)[table];
          if (!rows || !Array.isArray(rows)) continue;

          const hasUserId = TABLES_WITH_USER_ID.has(table);
          const primaryKeys = table === "settings" ? ["key", "user_id"] : ["id"];
          const validColumns = await getTableColumns(table);

          for (const rawRow of rows) {
            if (!rawRow || typeof rawRow !== "object") continue;
            const row = { ...(rawRow as Record<string, unknown>) };
            if (hasUserId) {
              row.user_id = userId;
            }

            // Remove internal client sync status tag if present
            delete row._sync_status;

            // Filter to only columns that exist in the database table
            const keys = Object.keys(row).filter((k) =>
              validColumns.size > 0 ? validColumns.has(k) : true,
            );
            if (keys.length === 0) continue;

            const placeholders = keys.map(() => "?").join(", ");
            const columns = keys.join(", ");
            const values = keys.map((k) => row[k]);

            const hasConflictTarget = primaryKeys.every((pk) => keys.includes(pk));
            const updateKeys = keys.filter((k) => !primaryKeys.includes(k));
            const updateClause = updateKeys.map((k) => `${k} = excluded.${k}`).join(", ");

            let rawSql = "";
            if (hasConflictTarget) {
              if (updateClause.length > 0) {
                rawSql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) ON CONFLICT(${primaryKeys.join(", ")}) DO UPDATE SET ${updateClause}`;
              } else {
                rawSql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) ON CONFLICT(${primaryKeys.join(", ")}) DO NOTHING`;
              }
            } else {
              rawSql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
            }

            try {
              const paramQuery = buildParamQuery(rawSql, values);
              await db.run(paramQuery);
            } catch (err) {
              console.warn(`Sync row insert failed for ${table}:`, err);
            }
          }
        }
      }

      // 2. Gather remote server changes since lastSyncAt
      const serverChanges: Record<string, unknown[]> = {};
      const syncedAt = new Date().toISOString();

      for (const table of SYNCABLE_TABLES) {
        const cols = await getTableColumns(table);
        const hasUserId = TABLES_WITH_USER_ID.has(table) && cols.has("user_id");
        const hasDeletedAt = cols.has("deleted_at");
        const targetTimeCol = TABLE_TIMESTAMP_COLUMN[table] || "updated_at";
        const timeCol = cols.has(targetTimeCol) ? targetTimeCol : "created_at";

        let rawSql = "";
        const args: (string | number | null)[] = [];

        if (table === "workout_exercises") {
          if (shouldFilterByTime) {
            if (hasDeletedAt) {
              rawSql = `SELECT we.* FROM workout_exercises we JOIN workouts w ON we.workout_id = w.id WHERE (w.user_id = ? OR w.user_id = '' OR w.user_id IS NULL) AND (datetime(we.${timeCol}) >= datetime(?) OR we.${timeCol} >= ? OR (we.deleted_at IS NOT NULL AND (datetime(we.deleted_at) >= datetime(?) OR we.deleted_at >= ?)))`;
              args.push(userId, lastSyncAt, lastSyncAt, lastSyncAt, lastSyncAt);
            } else {
              rawSql = `SELECT we.* FROM workout_exercises we JOIN workouts w ON we.workout_id = w.id WHERE (w.user_id = ? OR w.user_id = '' OR w.user_id IS NULL) AND (datetime(we.${timeCol}) >= datetime(?) OR we.${timeCol} >= ?)`;
              args.push(userId, lastSyncAt, lastSyncAt);
            }
          } else {
            rawSql = `SELECT we.* FROM workout_exercises we JOIN workouts w ON we.workout_id = w.id WHERE (w.user_id = ? OR w.user_id = '' OR w.user_id IS NULL)`;
            args.push(userId);
          }
        } else if (table === "exercise_logs") {
          if (shouldFilterByTime) {
            if (hasDeletedAt) {
              rawSql = `SELECT el.* FROM exercise_logs el JOIN workout_sessions ws ON el.session_id = ws.id WHERE (ws.user_id = ? OR ws.user_id = '' OR ws.user_id IS NULL) AND (datetime(el.${timeCol}) >= datetime(?) OR el.${timeCol} >= ? OR (el.deleted_at IS NOT NULL AND (datetime(el.deleted_at) >= datetime(?) OR el.deleted_at >= ?)))`;
              args.push(userId, lastSyncAt, lastSyncAt, lastSyncAt, lastSyncAt);
            } else {
              rawSql = `SELECT el.* FROM exercise_logs el JOIN workout_sessions ws ON el.session_id = ws.id WHERE (ws.user_id = ? OR ws.user_id = '' OR ws.user_id IS NULL) AND (datetime(el.${timeCol}) >= datetime(?) OR el.${timeCol} >= ?)`;
              args.push(userId, lastSyncAt, lastSyncAt);
            }
          } else {
            rawSql = `SELECT el.* FROM exercise_logs el JOIN workout_sessions ws ON el.session_id = ws.id WHERE (ws.user_id = ? OR ws.user_id = '' OR ws.user_id IS NULL)`;
            args.push(userId);
          }
        } else if (table === "categories") {
          const catCondition = "(user_id = ? OR user_id = '' OR user_id IS NULL OR is_system = 1)";
          if (shouldFilterByTime) {
            if (hasDeletedAt) {
              rawSql = `SELECT * FROM categories WHERE ${catCondition} AND (datetime(${timeCol}) >= datetime(?) OR ${timeCol} >= ? OR (deleted_at IS NOT NULL AND (datetime(deleted_at) >= datetime(?) OR deleted_at >= ?)))`;
              args.push(userId, lastSyncAt, lastSyncAt, lastSyncAt, lastSyncAt);
            } else {
              rawSql = `SELECT * FROM categories WHERE ${catCondition} AND (datetime(${timeCol}) >= datetime(?) OR ${timeCol} >= ?)`;
              args.push(userId, lastSyncAt, lastSyncAt);
            }
          } else {
            rawSql = `SELECT * FROM categories WHERE ${catCondition}`;
            args.push(userId);
          }
        } else if (hasUserId) {
          if (shouldFilterByTime) {
            if (hasDeletedAt) {
              rawSql = `SELECT * FROM ${table} WHERE (user_id = ? OR user_id = '' OR user_id IS NULL) AND (datetime(${timeCol}) >= datetime(?) OR ${timeCol} >= ? OR (deleted_at IS NOT NULL AND (datetime(deleted_at) >= datetime(?) OR deleted_at >= ?)))`;
              args.push(userId, lastSyncAt, lastSyncAt, lastSyncAt, lastSyncAt);
            } else {
              rawSql = `SELECT * FROM ${table} WHERE (user_id = ? OR user_id = '' OR user_id IS NULL) AND (datetime(${timeCol}) >= datetime(?) OR ${timeCol} >= ?)`;
              args.push(userId, lastSyncAt, lastSyncAt);
            }
          } else {
            rawSql = `SELECT * FROM ${table} WHERE (user_id = ? OR user_id = '' OR user_id IS NULL)`;
            args.push(userId);
          }
        } else {
          if (shouldFilterByTime) {
            if (hasDeletedAt) {
              rawSql = `SELECT * FROM ${table} WHERE (datetime(${timeCol}) >= datetime(?) OR ${timeCol} >= ? OR (deleted_at IS NOT NULL AND (datetime(deleted_at) >= datetime(?) OR deleted_at >= ?)))`;
              args.push(lastSyncAt, lastSyncAt, lastSyncAt, lastSyncAt);
            } else {
              rawSql = `SELECT * FROM ${table} WHERE (datetime(${timeCol}) >= datetime(?) OR ${timeCol} >= ?)`;
              args.push(lastSyncAt, lastSyncAt);
            }
          } else {
            rawSql = `SELECT * FROM ${table}`;
          }
        }

        try {
          const query = buildParamQuery(rawSql, args);
          const result = await db.all<Record<string, unknown>>(query);
          if (result.length > 0) {
            serverChanges[table] = result.map((row) => ({ ...row }));
          }
        } catch (err) {
          console.warn(`Failed to pull server changes for ${table}:`, err);
        }
      }

      res.json({
        serverChanges,
        syncedAt,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

/**
 * Build a parameterized Drizzle SQL query from a raw SQL string with ? placeholders
 * and corresponding argument values.
 */
function buildParamQuery(rawSql: string, args: unknown[]) {
  const parts = rawSql.split("?");
  if (parts.length === 1) return sql.raw(rawSql);

  let query = sql.raw(parts[0]);
  for (let i = 0; i < args.length; i++) {
    query = sql`${query}${args[i]}${sql.raw(parts[i + 1] || "")}`;
  }
  return query;
}
