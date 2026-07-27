import type Database from "better-sqlite3";
import type { AppConfig } from "./config.js";

import { initAuthModule } from "./modules/auth/index.js";
import { initBackupModule } from "./modules/backup/index.js";
import { initDashboardModule } from "./modules/dashboard/index.js";
import { initFinanceModule } from "./modules/finance/index.js";
import { initHabitsModule } from "./modules/habits/index.js";
import { initHealthModule } from "./modules/health/index.js";
import { initNewsModule } from "./modules/news/index.js";
import { initNotificationsModule } from "./modules/notifications/index.js";
import { initRoutineModule } from "./modules/routine/index.js";
import { initSkillsModule } from "./modules/skills/index.js";
import { initWorkoutsModule } from "./modules/workouts/index.js";
import { createDatabase } from "./shared/db.js";
import { runMigrations } from "./shared/migrations/runner.js";

export interface Container {
  config: AppConfig;
  db: Database.Database;
  modules: {
    auth: ReturnType<typeof initAuthModule>;
    backup: ReturnType<typeof initBackupModule>;
    dashboard: ReturnType<typeof initDashboardModule>;
    finance: ReturnType<typeof initFinanceModule>;
    habits: ReturnType<typeof initHabitsModule>;
    health: ReturnType<typeof initHealthModule>;
    news: ReturnType<typeof initNewsModule>;
    notifications: ReturnType<typeof initNotificationsModule>;
    routine: ReturnType<typeof initRoutineModule>;
    skills: ReturnType<typeof initSkillsModule>;
    workouts: ReturnType<typeof initWorkoutsModule>;
  };
  startBackgroundJobs: () => void;
  stopBackgroundJobs: () => void;
}

export function createContainer(config: AppConfig): Container {
  const db = createDatabase(config.dbPath);
  runMigrations(db, new URL("./shared/migrations/", import.meta.url).pathname);

  const auth = initAuthModule();
  const backup = initBackupModule(config.dbPath);
  const routine = initRoutineModule(db);
  const habits = initHabitsModule(db);
  const dashboard = initDashboardModule({
    taskRepo: routine.taskRepo,
    habitLogService: habits.habitLogService,
  });
  const notifications = initNotificationsModule(db);
  const workouts = initWorkoutsModule(db);
  const finance = initFinanceModule(db);
  const news = initNewsModule(db);
  const skills = initSkillsModule(db);
  const health = initHealthModule(db);

  const startBackgroundJobs = () => {
    news.newsScheduler.start();
    notifications.notificationScheduler.start();
  };

  const stopBackgroundJobs = () => {
    news.newsScheduler.stop();
    notifications.notificationScheduler.stop();
  };

  return {
    config,
    db,
    modules: {
      auth,
      backup,
      dashboard,
      finance,
      habits,
      health,
      news,
      notifications,
      routine,
      skills,
      workouts,
    },
    startBackgroundJobs,
    stopBackgroundJobs,
  };
}
