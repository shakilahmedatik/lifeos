import type { DrizzleClient } from "../../shared/db.js";
import { DrizzleRoutineCategoryRepository } from "./adapters/sqlite/sqlite-routine-category-repository.js";
import { DrizzleTaskRepository } from "./adapters/sqlite/sqlite-task-repository.js";
import { createRoutineRouter } from "./api/router.js";

export function initRoutineModule(db: DrizzleClient) {
  const taskRepo = new DrizzleTaskRepository(db);
  const categoryRepo = new DrizzleRoutineCategoryRepository(db);
  const router = createRoutineRouter(taskRepo, categoryRepo);

  return {
    taskRepo,
    categoryRepo,
    router,
  };
}
