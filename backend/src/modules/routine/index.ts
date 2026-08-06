import type { Client } from "@libsql/client";
import { SqliteTaskRepository } from "./adapters/sqlite/sqlite-task-repository.js";
import { createRoutineRouter } from "./api/router.js";

export function initRoutineModule(client: Client) {
  const taskRepo = new SqliteTaskRepository(client);
  const router = createRoutineRouter(taskRepo);

  return {
    taskRepo,
    router,
  };
}
