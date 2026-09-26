import { sql } from "drizzle-orm";
import { index, integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// ── Better Auth Core Tables ─────────────────────────────────────────────────

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: text("createdAt").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updatedAt").notNull().default(sql`(datetime('now'))`),
  pin: text("pin"),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: text("expiresAt").notNull(),
    token: text("token").notNull().unique(),
    createdAt: text("createdAt").notNull().default(sql`(datetime('now'))`),
    updatedAt: text("updatedAt").notNull().default(sql`(datetime('now'))`),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("idx_session_userId").on(t.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: text("accessTokenExpiresAt"),
    refreshTokenExpiresAt: text("refreshTokenExpiresAt"),
    scope: text("scope"),
    password: text("password"),
    createdAt: text("createdAt").notNull().default(sql`(datetime('now'))`),
    updatedAt: text("updatedAt").notNull().default(sql`(datetime('now'))`),
  },
  (t) => [index("idx_account_userId").on(t.userId)],
);

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: text("expiresAt").notNull(),
  createdAt: text("createdAt").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updatedAt").notNull().default(sql`(datetime('now'))`),
});

// ── Routine: Tasks ──────────────────────────────────────────────────────────

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().default(""),
    title: text("title").notNull(),
    category: text("category").notNull().default("general"),
    date: text("date").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    status: text("status").notNull().default("planned"),
    notes: text("notes"),
    reminderMinutesBefore: integer("reminder_minutes_before"),
    reminderSound: integer("reminder_sound").notNull().default(1),
    recurrence: text("recurrence").notNull().default("none"),
    subtasks: text("subtasks").default("[]"),
    referenceId: text("reference_id"),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
    updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
    deletedAt: text("deleted_at"),
  },
  (t) => [
    index("idx_tasks_user_id").on(t.userId),
    index("idx_tasks_date").on(t.date),
    index("idx_tasks_recurrence").on(t.recurrence),
  ],
);

// ── Routine: Categories ─────────────────────────────────────────────────────

export const routineCategories = sqliteTable(
  "routine_categories",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().default(""),
    name: text("name").notNull(),
    color: text("color").notNull().default("#3b82f6"),
    icon: text("icon"),
    isDefault: integer("is_default").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
    updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
    deletedAt: text("deleted_at"),
  },
  (t) => [
    index("idx_routine_categories_user_id").on(t.userId),
    index("idx_routine_categories_sort_order").on(t.sortOrder),
  ],
);

// ── Habits ──────────────────────────────────────────────────────────────────

export const habits = sqliteTable(
  "habits",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().default(""),
    name: text("name").notNull(),
    frequency: text("frequency").default("daily"),
    targetDaysPerWeek: integer("target_days_per_week"),
    type: text("type").notNull().default("boolean"),
    category: text("category").notNull().default("general"),
    config: text("config").notNull().default('{"type":"boolean"}'),
    icon: text("icon"),
    color: text("color"),
    archived: integer("archived").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
    updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
    deletedAt: text("deleted_at"),
  },
  (t) => [
    index("idx_habits_user_id").on(t.userId),
    index("idx_habits_archived").on(t.archived),
    index("idx_habits_sort_order").on(t.sortOrder),
  ],
);

export const habitLogs = sqliteTable(
  "habit_logs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().default(""),
    habitId: text("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    value: real("value").notNull().default(1),
    meta: text("meta"),
    loggedAt: text("logged_at").notNull().default(sql`(datetime('now'))`),
    deletedAt: text("deleted_at"),
  },
  (t) => [
    index("idx_habit_logs_user_id").on(t.userId),
    index("idx_habit_logs_date").on(t.date),
    index("idx_habit_logs_habit_date").on(t.habitId, t.date),
  ],
);

// ── Workouts & Exercises ────────────────────────────────────────────────────

export const exercises = sqliteTable("exercises", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().default(""),
  name: text("name").notNull(),
  category: text("category").notNull().default("general"),
  equipment: text("equipment").notNull().default("other"),
  videoUrl: text("video_url"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
  deletedAt: text("deleted_at"),
});

export const workouts = sqliteTable(
  "workouts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().default(""),
    name: text("name").notNull(),
    description: text("description"),
    scheduledDay: text("scheduled_day"),
    scheduledTime: text("scheduled_time"),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
    updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
    deletedAt: text("deleted_at"),
  },
  (t) => [index("idx_workouts_user_id").on(t.userId)],
);

export const workoutExercises = sqliteTable(
  "workout_exercises",
  {
    id: text("id").primaryKey(),
    workoutId: text("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    exerciseId: text("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    sets: integer("sets").notNull().default(3),
    reps: integer("reps").notNull().default(10),
    weight: real("weight"),
    restSeconds: integer("rest_seconds").notNull().default(60),
    orderIndex: integer("order_index").notNull().default(0),
    weightPerSet: text("weight_per_set"),
    repsPerSet: text("reps_per_set"),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
    deletedAt: text("deleted_at"),
  },
  (t) => [
    index("idx_workout_exercises_workout_id").on(t.workoutId),
    index("idx_workout_exercises_exercise_id").on(t.exerciseId),
  ],
);

export const workoutSessions = sqliteTable(
  "workout_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().default(""),
    workoutId: text("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    startedAt: text("started_at").notNull().default(sql`(datetime('now'))`),
    completedAt: text("completed_at"),
    durationSeconds: integer("duration_seconds"),
    notes: text("notes"),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
    deletedAt: text("deleted_at"),
  },
  (t) => [
    index("idx_workout_sessions_user_id").on(t.userId),
    index("idx_workout_sessions_workout_id").on(t.workoutId),
    index("idx_workout_sessions_started_at").on(t.startedAt),
  ],
);

export const exerciseLogs = sqliteTable(
  "exercise_logs",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => workoutSessions.id, { onDelete: "cascade" }),
    exerciseId: text("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    setNumber: integer("set_number").notNull(),
    actualReps: integer("actual_reps").notNull(),
    actualWeight: real("actual_weight"),
    completedAt: text("completed_at").notNull().default(sql`(datetime('now'))`),
    deletedAt: text("deleted_at"),
  },
  (t) => [
    index("idx_exercise_logs_session_id").on(t.sessionId),
    index("idx_exercise_logs_exercise_id").on(t.exerciseId),
  ],
);

// ── Finance ─────────────────────────────────────────────────────────────────

export const financeAccounts = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().default(""),
    name: text("name").notNull(),
    type: text("type").notNull(),
    archived: integer("archived").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
    updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
    deletedAt: text("deleted_at"),
  },
  (t) => [
    index("idx_accounts_user_id").on(t.userId),
    index("idx_accounts_type").on(t.type),
    index("idx_accounts_archived").on(t.archived),
  ],
);

export const categories = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().default(""),
    name: text("name").notNull(),
    kind: text("kind").notNull(),
    isSystem: integer("is_system").notNull().default(0),
    archived: integer("archived").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
    updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
    deletedAt: text("deleted_at"),
  },
  (t) => [
    index("idx_categories_user_id").on(t.userId),
    index("idx_categories_kind").on(t.kind),
    index("idx_categories_archived").on(t.archived),
  ],
);

export const transactions = sqliteTable(
  "transactions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().default(""),
    accountId: text("account_id")
      .notNull()
      .references(() => financeAccounts.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    date: text("date").notNull(),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").notNull().default("BDT"),
    note: text("note"),
    transferPairId: text("transfer_pair_id"),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
    updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
    deletedAt: text("deleted_at"),
  },
  (t) => [
    index("idx_transactions_user_id").on(t.userId),
    index("idx_transactions_account_id").on(t.accountId),
    index("idx_transactions_category_id").on(t.categoryId),
    index("idx_transactions_date").on(t.date),
  ],
);

// ── Skills & Learning ───────────────────────────────────────────────────────

export const skillAreas = sqliteTable(
  "skill_areas",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().default(""),
    name: text("name").notNull(),
    category: text("category").notNull().default("general"),
    color: text("color"),
    icon: text("icon"),
    targetHours: real("target_hours").notNull().default(100),
    weeklyGoalHours: real("weekly_goal_hours").notNull().default(5),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
    updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
    deletedAt: text("deleted_at"),
  },
  (t) => [index("idx_skill_areas_user_id").on(t.userId)],
);

export const learningResources = sqliteTable(
  "learning_resources",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().default(""),
    skillAreaId: text("skill_area_id")
      .notNull()
      .references(() => skillAreas.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    type: text("type").notNull(),
    totalUnits: real("total_units"),
    unit: text("unit"),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
    updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
    deletedAt: text("deleted_at"),
  },
  (t) => [
    index("idx_learning_resources_skill_area").on(t.skillAreaId),
    index("idx_learning_resources_user_id").on(t.userId),
  ],
);

export const learningLogs = sqliteTable(
  "learning_logs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().default(""),
    resourceId: text("resource_id")
      .notNull()
      .references(() => learningResources.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    minutesSpent: integer("minutes_spent").notNull().default(0),
    unitsCompleted: real("units_completed"),
    notes: text("notes"),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
    updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
    deletedAt: text("deleted_at"),
  },
  (t) => [
    index("idx_learning_logs_user_id").on(t.userId),
    index("idx_learning_logs_resource_id").on(t.resourceId),
    index("idx_learning_logs_date").on(t.date),
  ],
);

// ── Settings ────────────────────────────────────────────────────────────────

export const settings = sqliteTable(
  "settings",
  {
    key: text("key").notNull(),
    userId: text("user_id").notNull().default(""),
    value: text("value").notNull(),
    updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
    deletedAt: text("deleted_at"),
  },
  (t) => [primaryKey({ columns: [t.key, t.userId] })],
);
