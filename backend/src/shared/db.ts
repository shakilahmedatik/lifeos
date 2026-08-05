import { existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { type Client, createClient } from "@libsql/client";
import Database from "better-sqlite3";
import { logger } from "./logger.js";

export type DbConnection = Database.Database | Client;

export function createDatabase(
  dbPath: string,
  databaseUrl?: string,
  databaseToken?: string,
): Database.Database {
  if (databaseUrl) {
    logger.info("Initializing Turso LibSQL database connection", { url: databaseUrl });
    // Turso client mode
    const client = createClient({
      url: databaseUrl,
      authToken: databaseToken,
    });
    return client as unknown as Database.Database;
  }

  const isMemory = dbPath === ":memory:";
  const resolvedPath = isMemory ? ":memory:" : resolve(dbPath);

  if (!isMemory) {
    mkdirSync(dirname(resolvedPath), { recursive: true });
    const size = existsSync(resolvedPath) ? statSync(resolvedPath).size : 0;
    logger.info("Initializing SQLite database", { path: resolvedPath, sizeBytes: size });
  } else {
    logger.info("Initializing SQLite in-memory database");
  }

  const db = new Database(resolvedPath);

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return db;
}
