import { resolve } from "node:path";

import dotenv from "dotenv";
import express from "express";

import { createDashboardRouter } from "./modules/dashboard/api/router.js";
import { SqliteHabitLogRepository } from "./modules/habits/adapters/sqlite/sqlite-habit-log-repository.js";
import { SqliteHabitRepository } from "./modules/habits/adapters/sqlite/sqlite-habit-repository.js";
import { createHabitsRouter } from "./modules/habits/api/router.js";
import { HabitLogService } from "./modules/habits/application/habit-log-service.js";
import { HabitService } from "./modules/habits/application/habit-service.js";
import { HabitStatsService } from "./modules/habits/application/habit-stats-service.js";
import { WeeklyReviewService } from "./modules/habits/application/weekly-review-service.js";
import { SqliteTaskRepository } from "./modules/routine/adapters/sqlite/sqlite-task-repository.js";
import { createRoutineRouter } from "./modules/routine/api/router.js";
import { createDatabase } from "./shared/db.js";
import { runMigrations } from "./shared/migrations/runner.js";

dotenv.config({ path: resolve(process.cwd(), "../.env") });

const PORT = Number(process.env.BACKEND_PORT || 3000);
const DB_PATH = process.env.DATABASE_PATH || "./data/lifeos.sqlite";

const db = createDatabase(resolve(DB_PATH));
runMigrations(db, new URL("./shared/migrations/", import.meta.url).pathname);

const taskRepo = new SqliteTaskRepository(db);
const habitRepo = new SqliteHabitRepository(db);
const habitLogRepo = new SqliteHabitLogRepository(db);

const habitService = new HabitService(habitRepo);
const habitLogService = new HabitLogService(habitRepo, habitLogRepo);
const habitStatsService = new HabitStatsService(habitRepo, habitLogRepo);
const weeklyReviewService = new WeeklyReviewService(habitRepo, habitLogRepo);

const app = express();
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", port: PORT });
});

app.use("/api/routine", createRoutineRouter(taskRepo));
app.use(
  "/api/habits",
  createHabitsRouter(habitService, habitLogService, habitStatsService, weeklyReviewService),
);
app.use("/api/dashboard", createDashboardRouter({ taskRepo, habitLogService }));

app.listen(PORT, "127.0.0.1", () => {
  console.log(`LifeOS backend running on http://127.0.0.1:${PORT}`);
});
