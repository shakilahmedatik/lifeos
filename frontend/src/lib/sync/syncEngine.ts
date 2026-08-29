import type Database from "@tauri-apps/plugin-sql";
import { request } from "../api.js";
import { isTauri } from "../dataSource.js";
import { getLocalDb } from "../local-db/index.js";

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
  "rss_feeds",
  "news_articles",
  "skill_areas",
  "learning_resources",
  "learning_logs",
  "reminders",
  "notifications",
  "settings",
] as const;

type SyncableTableName = (typeof SYNCABLE_TABLES)[number];

export interface SyncOptions {
  forceFull?: boolean;
}

export interface SyncResult {
  status: "success" | "already-syncing" | "skipped-web-mode" | "error";
  pushedCount?: number;
  pulledCount?: number;
  error?: string;
}

export class SyncEngine {
  private syncing = false;
  private tableColumnsCache = new Map<string, Set<string>>();

  private async getLocalTableColumns(db: Database, table: string): Promise<Set<string>> {
    const cached = this.tableColumnsCache.get(table);
    if (cached) return cached;
    try {
      const res = await db.select<{ name: string }[]>(`PRAGMA table_info(${table})`);
      const cols = new Set(res.map((r) => r.name));
      this.tableColumnsCache.set(table, cols);
      return cols;
    } catch {
      return new Set();
    }
  }

  async sync(options?: SyncOptions): Promise<SyncResult> {
    if (!isTauri()) return { status: "skipped-web-mode" };
    if (this.syncing) return { status: "already-syncing" };

    this.syncing = true;

    try {
      const db = await getLocalDb();

      let currentUserId: string | null = null;
      try {
        const rawUser =
          typeof localStorage !== "undefined" ? localStorage.getItem("lifeos_user") : null;
        if (rawUser) {
          const parsed = JSON.parse(rawUser);
          currentUserId = parsed?.id || null;
        }
      } catch {}

      // 1. Fetch metadata
      const meta = await db.select<{ last_sync_at: string | null; user_id: string | null }[]>(
        "SELECT last_sync_at, user_id FROM _sync_meta WHERE id = 1",
      );
      const lastSyncAtMeta = meta[0]?.last_sync_at || null;
      const lastSyncedUser = meta[0]?.user_id || null;

      // If user changed or forceFull was requested, pull all data
      const userChanged = Boolean(
        currentUserId && lastSyncedUser && currentUserId !== lastSyncedUser,
      );
      const isFullSync = Boolean(options?.forceFull || userChanged || !lastSyncAtMeta);
      const lastSyncAt = isFullSync ? null : lastSyncAtMeta;

      // 2. Gather local pending changes
      const localChanges: Record<string, Record<string, unknown>[]> = {};
      const pushedIds: Record<string, string[]> = {};
      let pushedCount = 0;

      for (const table of SYNCABLE_TABLES) {
        const rows = await db.select<Record<string, unknown>[]>(
          `SELECT * FROM ${table} WHERE _sync_status = 'pending'`,
        );
        if (rows.length > 0) {
          localChanges[table] = rows;
          const primaryKey = table === "settings" ? "key" : "id";
          pushedIds[table] = rows
            .map((r) => r[primaryKey])
            .filter((id): id is string => typeof id === "string" && id.length > 0);
          pushedCount += rows.length;
        }
      }

      // 3. Send bulk sync payload to backend
      const response = await request<{
        serverChanges: Record<string, Record<string, unknown>[]>;
        syncedAt: string;
      }>("/api/sync", {
        method: "POST",
        body: JSON.stringify({
          lastSyncAt,
          forceFull: isFullSync,
          changes: localChanges,
        }),
      });

      let pulledCount = 0;

      // 4. Upsert remote server changes into local SQLite
      if (response.serverChanges) {
        for (const [table, rows] of Object.entries(response.serverChanges)) {
          if (!SYNCABLE_TABLES.includes(table as SyncableTableName)) continue;
          if (Array.isArray(rows)) {
            for (const row of rows) {
              await this.upsertRemoteRow(db, table, row);
              pulledCount++;
            }
          }
        }
      }

      // 5. Mark only the sent local pending changes as synced
      for (const [table, ids] of Object.entries(pushedIds)) {
        if (ids.length === 0) continue;
        const primaryKey = table === "settings" ? "key" : "id";
        for (let i = 0; i < ids.length; i += 100) {
          const chunk = ids.slice(i, i + 100);
          const placeholders = chunk.map(() => "?").join(", ");
          await db.execute(
            `UPDATE ${table} SET _sync_status = 'synced' WHERE ${primaryKey} IN (${placeholders}) AND _sync_status = 'pending'`,
            chunk,
          );
        }
      }

      // 6. Update sync metadata
      await db.execute("UPDATE _sync_meta SET last_sync_at = ?, user_id = ? WHERE id = 1", [
        response.syncedAt,
        currentUserId,
      ]);

      // 7. Cleanup old soft-deleted records (> 30 days)
      const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();
      for (const table of SYNCABLE_TABLES) {
        await db.execute(`DELETE FROM ${table} WHERE deleted_at IS NOT NULL AND deleted_at < ?`, [
          cutoff,
        ]);
      }

      return {
        status: "success",
        pushedCount,
        pulledCount,
      };
    } catch (err) {
      return {
        status: "error",
        error: err instanceof Error ? err.message : "Sync failed",
      };
    } finally {
      this.syncing = false;
    }
  }

  private async upsertRemoteRow(
    db: Database,
    table: string,
    row: Record<string, unknown>,
  ): Promise<void> {
    const keys = Object.keys(row);
    if (keys.length === 0) return;

    const validColumns = await this.getLocalTableColumns(db, table);

    // Standardize object fields into stringified JSON if needed
    const processedRow: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      if (validColumns.size > 0 && !validColumns.has(k)) {
        continue;
      }
      if (v !== null && typeof v === "object") {
        processedRow[k] = JSON.stringify(v);
      } else {
        processedRow[k] = v;
      }
    }
    if (validColumns.size === 0 || validColumns.has("_sync_status")) {
      processedRow._sync_status = "synced";
    }

    const procKeys = Object.keys(processedRow);
    if (procKeys.length === 0) return;

    const placeholders = procKeys.map(() => "?").join(", ");
    const columns = procKeys.join(", ");
    const values = procKeys.map((k) => processedRow[k]);

    const updateClause = procKeys
      .filter((k) => k !== "id" && k !== "key")
      .map((k) => `${k} = excluded.${k}`)
      .join(", ");

    const primaryKey = table === "settings" ? "key" : "id";
    const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) ON CONFLICT(${primaryKey}) DO UPDATE SET ${updateClause}`;

    await db.execute(sql, values);
  }
}

export const syncEngine = new SyncEngine();
