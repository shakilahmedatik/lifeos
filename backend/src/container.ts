import type { AppConfig } from "./config.js";
import { initAuthModule } from "./modules/auth/index.js";
import { initDashboardModule } from "./modules/dashboard/index.js";
import { initFinanceModule } from "./modules/finance/index.js";
import { initHabitsModule } from "./modules/habits/index.js";
import type { SchedulerStatus } from "./modules/health/api/router.js";
import { initHealthModule } from "./modules/health/index.js";
import { initRoutineModule } from "./modules/routine/index.js";
import { initSettingsModule } from "./modules/settings/index.js";
import { initSkillsModule } from "./modules/skills/index.js";
import { createSyncRouter } from "./modules/sync/router.js";
import { initWorkoutsModule } from "./modules/workouts/index.js";
import type { DrizzleClient } from "./shared/db.js";
import { createDatabase } from "./shared/db.js";

export interface Container {
  config: AppConfig;
  db: DrizzleClient;
  modules: {
    auth: ReturnType<typeof initAuthModule>;
    dashboard: ReturnType<typeof initDashboardModule>;
    finance: ReturnType<typeof initFinanceModule>;
    habits: ReturnType<typeof initHabitsModule>;
    health: ReturnType<typeof initHealthModule>;
    routine: ReturnType<typeof initRoutineModule>;
    settings: ReturnType<typeof initSettingsModule>;
    skills: ReturnType<typeof initSkillsModule>;
    sync: { router: ReturnType<typeof createSyncRouter> };
    workouts: ReturnType<typeof initWorkoutsModule>;
  };
  startBackgroundJobs: () => void;
  stopBackgroundJobs: () => void;
}

export async function createContainer(config: AppConfig): Promise<Container> {
  const { db } = createDatabase(config.dbPath, config.databaseUrl, config.tursoDatabaseToken);

  const auth = initAuthModule(db, config);
  const routine = initRoutineModule(db);
  const habits = initHabitsModule(db);
  const workouts = initWorkoutsModule(db);
  const finance = initFinanceModule(db);
  const skills = initSkillsModule(db);
  const settings = initSettingsModule(db);
  const sync = { router: createSyncRouter(db) };
  const dashboard = initDashboardModule({
    taskRepo: routine.taskRepo,
    habitLogService: habits.habitLogService,
    habitStatsService: habits.habitStatsService,
    habitRepo: habits.habitRepo,
    workoutSessionRepo: workouts.workoutSessionRepo,
    workoutRepo: workouts.workoutRepo,
    learningLogService: skills.learningLogService,
    skillAreaService: skills.skillAreaService,
  });

  const getSchedulerStatus = (): SchedulerStatus[] => {
    return [];
  };

  const health = initHealthModule(db, getSchedulerStatus);

  const startBackgroundJobs = () => {};
  const stopBackgroundJobs = () => {};

  return {
    config,
    db,
    modules: {
      auth,
      dashboard,
      finance,
      habits,
      health,
      routine,
      settings,
      skills,
      sync,
      workouts,
    },
    startBackgroundJobs,
    stopBackgroundJobs,
  };
}
