import { fileURLToPath } from "node:url";
import type { Client } from "@libsql/client";
import type { AppConfig } from "./config.js";
import { initAuthModule } from "./modules/auth/index.js";
import { initBackupModule } from "./modules/backup/index.js";
import { initCronModule } from "./modules/cron/index.js";
import { initDashboardModule } from "./modules/dashboard/index.js";
import { initFinanceModule } from "./modules/finance/index.js";
import { initHabitsModule } from "./modules/habits/index.js";
import type { SchedulerStatus } from "./modules/health/api/router.js";
import { initHealthModule } from "./modules/health/index.js";
import { initNewsModule } from "./modules/news/index.js";
import { initNotificationsModule } from "./modules/notifications/index.js";
import { initRemindersModule } from "./modules/reminders/index.js";
import { initRoutineModule } from "./modules/routine/index.js";
import { initSkillsModule } from "./modules/skills/index.js";
import { initWorkoutsModule } from "./modules/workouts/index.js";
import { createDatabase } from "./shared/db.js";
import { runMigrations } from "./shared/migrations/runner.js";

export interface Container {
  config: AppConfig;
  db: Client;
  modules: {
    auth: ReturnType<typeof initAuthModule>;
    backup: ReturnType<typeof initBackupModule>;
    cron: ReturnType<typeof initCronModule>;
    dashboard: ReturnType<typeof initDashboardModule>;
    finance: ReturnType<typeof initFinanceModule>;
    habits: ReturnType<typeof initHabitsModule>;
    health: ReturnType<typeof initHealthModule>;
    news: ReturnType<typeof initNewsModule>;
    notifications: ReturnType<typeof initNotificationsModule>;
    reminders: ReturnType<typeof initRemindersModule>;
    routine: ReturnType<typeof initRoutineModule>;
    skills: ReturnType<typeof initSkillsModule>;
    workouts: ReturnType<typeof initWorkoutsModule>;
  };
  triggerLazyJobs: () => Promise<void>;
  startBackgroundJobs: () => void;
  stopBackgroundJobs: () => void;
}

export async function createContainer(config: AppConfig): Promise<Container> {
  const db = createDatabase(config.dbPath, config.databaseUrl, config.tursoDatabaseToken);
  await runMigrations(db, fileURLToPath(new URL("./shared/migrations/", import.meta.url)));

  const auth = initAuthModule(db, config);
  const backup = initBackupModule(config.dbPath);
  const routine = initRoutineModule(db);
  const habits = initHabitsModule(db);
  const reminders = initRemindersModule(db);
  const notifications = initNotificationsModule(db);
  const workouts = initWorkoutsModule(db);
  const finance = initFinanceModule(db);
  const news = initNewsModule(db);
  const skills = initSkillsModule(db);
  const cron = initCronModule(news.rssFetchService, config);

  const dashboard = initDashboardModule({
    taskRepo: routine.taskRepo,
    habitLogService: habits.habitLogService,
    habitStatsService: habits.habitStatsService,
    habitRepo: habits.habitRepo,
    reminderService: reminders.reminderService,
    workoutSessionRepo: workouts.workoutSessionRepo,
    workoutRepo: workouts.workoutRepo,
    learningLogService: skills.learningLogService,
    skillAreaService: skills.skillAreaService,
    newsArticleRepo: news.newsArticleRepo,
    rssFeedRepo: news.rssFeedRepo,
  });

  const getSchedulerStatus = (): SchedulerStatus[] => {
    const statuses: SchedulerStatus[] = [];
    const newsStatus = news.newsScheduler.getStatus();
    if (newsStatus) statuses.push(newsStatus);
    const notifStatus = notifications.notificationScheduler.getStatus();
    if (notifStatus) statuses.push(notifStatus);
    return statuses;
  };

  const health = initHealthModule(db, getSchedulerStatus);

  const triggerLazyJobs = async () => {
    try {
      await notifications.notificationScheduler.checkAndSendNotificationsLazy();
      await news.newsScheduler.runFetchCycleIfNeeded();
    } catch {
      // Lazy background execution errors handled internally in schedulers
    }
  };

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
      cron,
      dashboard,
      finance,
      habits,
      health,
      news,
      notifications,
      reminders,
      routine,
      skills,
      workouts,
    },
    triggerLazyJobs,
    startBackgroundJobs,
    stopBackgroundJobs,
  };
}
