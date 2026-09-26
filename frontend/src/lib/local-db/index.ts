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
      try {
        await dbInstance.execute(sql);
      } catch {}
    }
  }

  return dbInstance;
}

export async function resetLocalDatabase(db?: Database): Promise<void> {
  const targetDb = db || (await getLocalDb());
  const tables = [
    "transactions",
    "accounts",
    "tasks",
    "habit_logs",
    "habits",
    "workout_exercises",
    "exercise_logs",
    "workout_sessions",
    "workouts",
    "learning_logs",
    "learning_resources",
    "skill_areas",
    "settings",
    "news_articles",
    "rss_feeds",
  ];

  for (const table of tables) {
    try {
      await targetDb.execute(`DELETE FROM ${table}`);
    } catch {}
  }

  try {
    await targetDb.execute("DELETE FROM categories WHERE is_system = 0");
  } catch {}

  try {
    await targetDb.execute("DELETE FROM routine_categories WHERE is_default = 0");
  } catch {}

  try {
    await targetDb.execute(
      "UPDATE _sync_meta SET last_sync_at = NULL, user_id = NULL WHERE id = 1",
    );
  } catch {}
}
