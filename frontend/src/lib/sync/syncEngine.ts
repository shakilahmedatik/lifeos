import type Database from "@tauri-apps/plugin-sql";
import { request } from "../api.js";
import { isTauri } from "../dataSource.js";
import { getLocalDb } from "../local-db/index.js";

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

type SyncableTableName = (typeof SYNCABLE_TABLES)[number];

export interface SyncResult {
  status: "success" | "already-syncing" | "skipped-web-mode" | "error";
  pushedCount?: number;
  pulledCount?: number;
  error?: string;
}

export class SyncEngine {
  private syncing = false;

  async sync(): Promise<SyncResult> {
    if (!isTauri()) return { status: "skipped-web-mode" };
    if (this.syncing) return { status: "already-syncing" };

    this.syncing = true;

    try {
      const db = await getLocalDb();

      // 1. Fetch metadata
      const meta = await db.select<{ last_sync_at: string | null }[]>(
        "SELECT last_sync_at FROM _sync_meta WHERE id = 1",
      );
      const lastSyncAt = meta[0]?.last_sync_at || null;

      // 2. Gather local pending changes
      const localChanges: Record<string, unknown[]> = {};
      let pushedCount = 0;

      for (const table of SYNCABLE_TABLES) {
        const rows = await db.select<unknown[]>(
          `SELECT * FROM ${table} WHERE _sync_status = 'pending'`,
        );
        if (rows.length > 0) {
          localChanges[table] = rows;
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

      // 5. Mark local pending changes as synced
      for (const table of SYNCABLE_TABLES) {
        await db.execute(
          `UPDATE ${table} SET _sync_status = 'synced' WHERE _sync_status = 'pending'`,
        );
      }

      // 6. Update sync metadata
      await db.execute("UPDATE _sync_meta SET last_sync_at = ? WHERE id = 1", [response.syncedAt]);

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

    // Standardize object fields into stringified JSON if needed
    const processedRow: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      if (v !== null && typeof v === "object") {
        processedRow[k] = JSON.stringify(v);
      } else {
        processedRow[k] = v;
      }
    }
    processedRow._sync_status = "synced";

    const procKeys = Object.keys(processedRow);
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
