import Database from "@tauri-apps/plugin-sql";
import { localMigrations } from "./migrations";

let dbInstance: Database | null = null;

export async function getLocalDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  dbInstance = await Database.load("sqlite:lifeos.db");

  // Run local schema setup
  for (const migration of localMigrations) {
    const statements = migration
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const sql of statements) {
      await dbInstance.execute(sql);
    }
  }

  return dbInstance;
}
