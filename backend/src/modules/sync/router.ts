import type { Client } from "@libsql/client";
import { Router } from "express";

const TABLES_WITH_USER_ID = new Set([
  "tasks",
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

export function createSyncRouter(client: Client): Router {
  const router = Router();

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

          for (const rawRow of rows) {
            if (!rawRow || typeof rawRow !== "object") continue;
            const row = { ...rawRow };
            if (hasUserId) {
              row.user_id = userId;
            }

            // Remove internal client sync status tag if present
            delete row._sync_status;

            const keys = Object.keys(row);
            if (keys.length === 0) continue;

            const placeholders = keys.map(() => "?").join(", ");
            const columns = keys.join(", ");
            const values = keys.map((k) => row[k]);

            // Conflict resolution: ON CONFLICT(id) DO UPDATE SET ... WHERE excluded.updated_at >= table.updated_at
            const updateClause = keys
              .filter((k) => k !== "id")
              .map((k) => `${k} = excluded.${k}`)
              .join(", ");

            const sql = keys.includes("id")
              ? `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) ON CONFLICT(id) DO UPDATE SET ${updateClause}`
              : `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;

            await client.execute({ sql, args: values });
          }
        }
      }

      // 2. Gather remote server changes since lastSyncAt
      const serverChanges: Record<string, unknown[]> = {};
      const syncedAt = new Date().toISOString();

      for (const table of SYNCABLE_TABLES) {
        const hasUserId = TABLES_WITH_USER_ID.has(table);

        let sql = "";
        const args: unknown[] = [];

        if (hasUserId) {
          if (lastSyncAt) {
            sql = `SELECT * FROM ${table} WHERE user_id = ? AND (updated_at > ? OR (deleted_at IS NOT NULL AND deleted_at > ?))`;
            args.push(userId, lastSyncAt, lastSyncAt);
          } else {
            sql = `SELECT * FROM ${table} WHERE user_id = ?`;
            args.push(userId);
          }
        } else {
          if (lastSyncAt) {
            sql = `SELECT * FROM ${table} WHERE updated_at > ? OR (deleted_at IS NOT NULL AND deleted_at > ?)`;
            args.push(lastSyncAt, lastSyncAt);
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
