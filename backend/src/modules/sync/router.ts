import type { Client } from "@libsql/client";
import { Router } from "express";

const TABLES_WITH_USER_ID = new Set([
  "tasks",
  "routine_categories",
  "habits",
  "habit_logs",
  "workouts",
  "workout_sessions",
  "accounts",
  "transactions",
  "rss_feeds",
  "news_articles",
  "skill_areas",
  "learning_logs",
  "reminders",
  "notifications",
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
  "reminders",
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
  reminders: "updated_at",
  settings: "updated_at",
};

export function createSyncRouter(client: Client): Router {
  const router = Router();
  const tableColumnsCache = new Map<string, Set<string>>();

  async function getTableColumns(table: string): Promise<Set<string>> {
    const cached = tableColumnsCache.get(table);
    if (cached) {
      return cached;
    }
    try {
      const res = await client.execute(`PRAGMA table_info(${table})`);
      const cols = new Set((res.rows as unknown as { name: string }[]).map((r) => r.name));
      tableColumnsCache.set(table, cols);
      return cols;
    } catch {
      return new Set();
    }
  }

  router.post("/", async (req, res, next) => {
    try {
      const userId = (req as unknown as { user: { id: string } }).user?.id || "";
      const { lastSyncAt, changes } = req.body || {};

      // 1. Apply incoming client changes (Last-write-wins)
      if (changes && typeof changes === "object") {
        for (const [table, rows] of Object.entries(changes)) {
          if (!SYNCABLE_TABLES.includes(table as (typeof SYNCABLE_TABLES)[number])) continue;
          if (!Array.isArray(rows)) continue;

          const hasUserId = TABLES_WITH_USER_ID.has(table);
          const primaryKey = table === "settings" ? "key" : "id";
          const validColumns = await getTableColumns(table);

          for (const rawRow of rows) {
            if (!rawRow || typeof rawRow !== "object") continue;
            const row = { ...rawRow };
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

            const updateClause = keys
              .filter((k) => k !== primaryKey)
              .map((k) => `${k} = excluded.${k}`)
              .join(", ");

            const sql = keys.includes(primaryKey)
              ? `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) ON CONFLICT(${primaryKey}) DO UPDATE SET ${updateClause}`
              : `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;

            try {
              await client.execute({ sql, args: values });
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
        const hasUserId = TABLES_WITH_USER_ID.has(table);
        const timeCol = TABLE_TIMESTAMP_COLUMN[table] || "updated_at";

        let sql = "";
        const args: (string | number | null)[] = [];

        if (hasUserId) {
          if (lastSyncAt) {
            sql = `SELECT * FROM ${table} WHERE (user_id = ? OR user_id = '' OR user_id IS NULL) AND (datetime(${timeCol}) > datetime(?) OR ${timeCol} > ? OR (deleted_at IS NOT NULL AND (datetime(deleted_at) > datetime(?) OR deleted_at > ?)))`;
            args.push(userId, lastSyncAt, lastSyncAt, lastSyncAt, lastSyncAt);
          } else {
            sql = `SELECT * FROM ${table} WHERE (user_id = ? OR user_id = '' OR user_id IS NULL)`;
            args.push(userId);
          }
        } else {
          if (lastSyncAt) {
            sql = `SELECT * FROM ${table} WHERE (datetime(${timeCol}) > datetime(?) OR ${timeCol} > ? OR (deleted_at IS NOT NULL AND (datetime(deleted_at) > datetime(?) OR deleted_at > ?)))`;
            args.push(lastSyncAt, lastSyncAt, lastSyncAt, lastSyncAt);
          } else {
            sql = `SELECT * FROM ${table}`;
          }
        }

        const result = await client.execute({ sql, args });
        if (result.rows.length > 0) {
          serverChanges[table] = result.rows.map((row) => ({ ...row }));
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
