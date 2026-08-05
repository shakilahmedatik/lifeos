import type Database from "better-sqlite3";
import { SqliteHabitLogRepository } from "./adapters/sqlite/sqlite-habit-log-repository.js";
import { SqliteHabitRepository } from "./adapters/sqlite/sqlite-habit-repository.js";
import { createHabitsRouter } from "./api/router.js";
import { HabitLogService } from "./application/habit-log-service.js";
import { HabitService } from "./application/habit-service.js";
import { HabitStatsService } from "./application/habit-stats-service.js";
import { WeeklyReviewService } from "./application/weekly-review-service.js";

export function initHabitsModule(db: Database.Database) {
  const habitRepo = new SqliteHabitRepository(db);
  const habitLogRepo = new SqliteHabitLogRepository(db);

  const habitService = new HabitService(habitRepo);
  const habitLogService = new HabitLogService(habitRepo, habitLogRepo);
  const habitStatsService = new HabitStatsService(habitRepo, habitLogRepo);
  const weeklyReviewService = new WeeklyReviewService(habitRepo, habitLogRepo);

  const router = createHabitsRouter(
    habitService,
    habitLogService,
    habitStatsService,
    weeklyReviewService,
    habitLogRepo,
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
