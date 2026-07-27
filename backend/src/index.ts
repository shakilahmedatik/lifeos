import { resolve } from "node:path";

import dotenv from "dotenv";
import express from "express";

import { createAuthRouter } from "./modules/auth/api/router.js";
import { createBackupRouter } from "./modules/backup/api/router.js";
import { createDashboardRouter } from "./modules/dashboard/api/router.js";
import { SqliteAccountRepository } from "./modules/finance/adapters/sqlite/sqlite-account-repository.js";
import { SqliteCategoryRepository } from "./modules/finance/adapters/sqlite/sqlite-category-repository.js";
import { SqliteTransactionRepository } from "./modules/finance/adapters/sqlite/sqlite-transaction-repository.js";
import { createFinanceRouter } from "./modules/finance/api/router.js";
import { AccountService } from "./modules/finance/application/account-service.js";
import { CategoryService } from "./modules/finance/application/category-service.js";
import { FinanceReportService } from "./modules/finance/application/finance-report-service.js";
import { TransactionService } from "./modules/finance/application/transaction-service.js";
import { SqliteHabitLogRepository } from "./modules/habits/adapters/sqlite/sqlite-habit-log-repository.js";
import { SqliteHabitRepository } from "./modules/habits/adapters/sqlite/sqlite-habit-repository.js";
import { createHabitsRouter } from "./modules/habits/api/router.js";
import { HabitLogService } from "./modules/habits/application/habit-log-service.js";
import { HabitService } from "./modules/habits/application/habit-service.js";
import { HabitStatsService } from "./modules/habits/application/habit-stats-service.js";
import { WeeklyReviewService } from "./modules/habits/application/weekly-review-service.js";
import { createHealthRouter } from "./modules/health/api/router.js";
import { createSqliteNewsArticleRepository } from "./modules/news/adapters/sqlite/sqlite-news-article-repository.js";
import { createSqliteRssFeedRepository } from "./modules/news/adapters/sqlite/sqlite-rss-feed-repository.js";
import { createNewsRouter } from "./modules/news/api/router.js";
import { createNewsScheduler } from "./modules/news/application/news-scheduler.js";
import { createRssFetchService } from "./modules/news/application/rss-fetch-service.js";
import { SqliteNotificationRepository } from "./modules/notifications/adapters/sqlite/sqlite-notification-repository.js";
import { createNotificationsRouter } from "./modules/notifications/api/router.js";
import { NotificationBroadcaster } from "./modules/notifications/application/notification-broadcaster.js";
import { NotificationScheduler } from "./modules/notifications/application/notification-scheduler.js";
import { NotificationService } from "./modules/notifications/application/notification-service.js";
import { SqliteTaskRepository } from "./modules/routine/adapters/sqlite/sqlite-task-repository.js";
import { createRoutineRouter } from "./modules/routine/api/router.js";
import { SqliteLearningLogRepository } from "./modules/skills/adapters/sqlite/sqlite-learning-log-repository.js";
import { SqliteLearningResourceRepository } from "./modules/skills/adapters/sqlite/sqlite-learning-resource-repository.js";
import { SqliteSkillAreaRepository } from "./modules/skills/adapters/sqlite/sqlite-skill-area-repository.js";
import { createSkillsRouter } from "./modules/skills/api/router.js";
import { LearningLogService } from "./modules/skills/application/learning-log-service.js";
import { LearningResourceService } from "./modules/skills/application/learning-resource-service.js";
import { SkillAreaService } from "./modules/skills/application/skill-area-service.js";
import { SqliteExerciseRepository } from "./modules/workouts/adapters/sqlite/sqlite-exercise-repository.js";
import { SqliteWorkoutRepository } from "./modules/workouts/adapters/sqlite/sqlite-workout-repository.js";
import { SqliteWorkoutSessionRepository } from "./modules/workouts/adapters/sqlite/sqlite-workout-session-repository.js";
import { createWorkoutsRouter } from "./modules/workouts/api/router.js";
import { ExerciseService } from "./modules/workouts/application/exercise-service.js";
import { WorkoutHistoryService } from "./modules/workouts/application/workout-history-service.js";
import { WorkoutService } from "./modules/workouts/application/workout-service.js";
import { WorkoutSessionService } from "./modules/workouts/application/workout-session-service.js";
import { authMiddleware } from "./shared/auth-middleware.js";
import { createDatabase } from "./shared/db.js";
import { runMigrations } from "./shared/migrations/runner.js";
import { apiRateLimiter } from "./shared/rate-limiter.js";

dotenv.config({ path: resolve(process.cwd(), "../.env") });

const PORT = Number(process.env.BACKEND_PORT || 3000);
const DB_PATH = process.env.DATABASE_PATH || "./data/lifeos.sqlite";
const FRONTEND_PORT = Number(process.env.FRONTEND_PORT || 5173);

const db = createDatabase(resolve(DB_PATH));
runMigrations(db, new URL("./shared/migrations/", import.meta.url).pathname);

const taskRepo = new SqliteTaskRepository(db);
const habitRepo = new SqliteHabitRepository(db);
const habitLogRepo = new SqliteHabitLogRepository(db);
const notificationRepo = new SqliteNotificationRepository(db);
const workoutRepo = new SqliteWorkoutRepository(db);
const exerciseRepo = new SqliteExerciseRepository(db);
const workoutSessionRepo = new SqliteWorkoutSessionRepository(db);
const accountRepo = new SqliteAccountRepository(db);
const categoryRepo = new SqliteCategoryRepository(db);
const transactionRepo = new SqliteTransactionRepository(db);
const rssFeedRepo = createSqliteRssFeedRepository(db);
const newsArticleRepo = createSqliteNewsArticleRepository(db);
const rssFetchService = createRssFetchService(rssFeedRepo, newsArticleRepo);
const newsScheduler = createNewsScheduler(rssFetchService);

const skillAreaRepo = new SqliteSkillAreaRepository(db);
const resourceRepo = new SqliteLearningResourceRepository(db);
const learningLogRepo = new SqliteLearningLogRepository(db);

const habitService = new HabitService(habitRepo);
const habitLogService = new HabitLogService(habitRepo, habitLogRepo);
const habitStatsService = new HabitStatsService(habitRepo, habitLogRepo);
const weeklyReviewService = new WeeklyReviewService(habitRepo, habitLogRepo);
const notificationService = new NotificationService(notificationRepo);
const notificationBroadcaster = new NotificationBroadcaster();
const notificationScheduler = new NotificationScheduler(
  notificationService,
  notificationBroadcaster,
);
const workoutService = new WorkoutService(workoutRepo);
const exerciseService = new ExerciseService(exerciseRepo);
const workoutSessionService = new WorkoutSessionService(workoutSessionRepo);
const workoutHistoryService = new WorkoutHistoryService(workoutSessionRepo);
const accountService = new AccountService(accountRepo, transactionRepo);
const categoryService = new CategoryService(categoryRepo);
const transactionService = new TransactionService(transactionRepo, accountRepo, categoryRepo);
const financeReportService = new FinanceReportService(transactionRepo, accountRepo, categoryRepo);

const skillAreaService = new SkillAreaService(skillAreaRepo);
const resourceService = new LearningResourceService(resourceRepo);
const learningLogService = new LearningLogService(learningLogRepo, resourceRepo, skillAreaRepo);

const app = express();

// CORS: restrict to local frontend origin
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", `http://localhost:${FRONTEND_PORT}`);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-auth-token");
  if (_req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

app.use(express.json());
app.use("/api", apiRateLimiter);

app.use("/api/health", createHealthRouter(db));
app.use("/api/auth", createAuthRouter());
app.use("/api", authMiddleware);

app.use("/api/routine", createRoutineRouter(taskRepo));
app.use(
  "/api/habits",
  createHabitsRouter(habitService, habitLogService, habitStatsService, weeklyReviewService),
);
app.use("/api/dashboard", createDashboardRouter({ taskRepo, habitLogService }));
app.use(
  "/api/notifications",
  createNotificationsRouter(notificationService, notificationBroadcaster),
);
app.use(
  "/api/workouts",
  createWorkoutsRouter(
    workoutService,
    exerciseService,
    workoutSessionService,
    workoutHistoryService,
  ),
);
app.use(
  "/api/finance",
  createFinanceRouter(accountService, categoryService, transactionService, financeReportService),
);
app.use("/api/news", createNewsRouter(rssFeedRepo, newsArticleRepo, rssFetchService));
app.use("/api/skills", createSkillsRouter(skillAreaService, resourceService, learningLogService));
app.use("/api/backup", createBackupRouter(resolve(DB_PATH)));

newsScheduler.start();
notificationScheduler.start();

app.listen(PORT, "127.0.0.1", () => {
  console.log(`LifeOS backend running on http://127.0.0.1:${PORT}`);
});
