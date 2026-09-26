import type { DrizzleClient } from "../../shared/db.js";
import { DrizzleHabitLogRepository } from "./adapters/sqlite/sqlite-habit-log-repository.js";
import { DrizzleHabitRepository } from "./adapters/sqlite/sqlite-habit-repository.js";
import { createHabitsRouter } from "./api/router.js";
import { HabitLogService } from "./application/habit-log-service.js";
import { HabitService } from "./application/habit-service.js";
import { HabitStatsService } from "./application/habit-stats-service.js";
import { WeeklyReviewService } from "./application/weekly-review-service.js";

export function initHabitsModule(db: DrizzleClient) {
  const habitRepo = new DrizzleHabitRepository(db);
  const habitLogRepo = new DrizzleHabitLogRepository(db);

  const habitService = new HabitService(habitRepo);
  const habitLogService = new HabitLogService(habitRepo, habitLogRepo);
  const habitStatsService = new HabitStatsService(habitRepo, habitLogRepo);
  const weeklyReviewService = new WeeklyReviewService(habitRepo, habitLogRepo);

  const router = createHabitsRouter(
    habitService,
    habitLogService,
    habitStatsService,
    weeklyReviewService,
  );

  return {
    habitRepo,
    habitLogRepo,
    habitService,
    habitLogService,
    habitStatsService,
    weeklyReviewService,
    router,
  };
}
