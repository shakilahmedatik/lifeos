import type Database from "better-sqlite3";
import { SqliteTaskRepository } from "./adapters/sqlite/sqlite-task-repository.js";
import { createRoutineRouter } from "./api/router.js";

export function initRoutineModule(db: Database.Database) {
  const taskRepo = new SqliteTaskRepository(db);
  const router = createRoutineRouter(taskRepo);

  return {
    taskRepo,
    router,
  };
}
