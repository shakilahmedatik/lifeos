import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { Client } from "@libsql/client";

export async function runMigrations(client: Client, migrationsDir: string): Promise<void> {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const appliedRes = await client.execute("SELECT version FROM schema_migrations ORDER BY version");
  const applied = appliedRes.rows.map((row) => Number(row.version));

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const version = Number.parseInt(file.split("_")[0], 10);
    if (applied.includes(version)) continue;

    const sql = readFileSync(join(migrationsDir, file), "utf-8");
    try {
      await client.executeMultiple(sql);
    } catch (err) {
      if ((err as Error).message.includes("duplicate column name")) {
        const statements = sql
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean);
        for (const stmt of statements) {
          try {
            await client.execute(stmt);
          } catch (stmtErr) {
            if (!(stmtErr as Error).message.includes("duplicate column name")) {
              throw stmtErr;
            }
          }
        }
      } else {
        throw err;
      }
    }

    await client.execute({
      sql: "INSERT OR IGNORE INTO schema_migrations (version) VALUES (?)",
      args: [version],
    });
  }
}
