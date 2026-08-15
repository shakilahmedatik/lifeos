import type { Client } from "@libsql/client";
import { SqliteRoutineCategoryRepository } from "./adapters/sqlite/sqlite-routine-category-repository.js";
import { SqliteTaskRepository } from "./adapters/sqlite/sqlite-task-repository.js";
import { createRoutineRouter } from "./api/router.js";

export function initRoutineModule(client: Client) {
  const taskRepo = new SqliteTaskRepository(client);
  const categoryRepo = new SqliteRoutineCategoryRepository(client);
  const router = createRoutineRouter(taskRepo, categoryRepo);

  return {
    taskRepo,
    categoryRepo,
    router,
  };
}
