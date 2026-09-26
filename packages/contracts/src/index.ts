export type DefaultTaskCategory =
  | "routine"
  | "must_do"
  | "work"
  | "workout"
  | "learning"
  | "habit"
  | "personal"
  | "general"
  | "flex";

export type TaskCategory = DefaultTaskCategory | (string & {});

export interface RoutineCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
  isDefault?: boolean;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface NewRoutineCategoryInput {
  name: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
}

export interface UpdateRoutineCategoryInput {
  name?: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
}

export type TaskStatus =
  | "todo"
  | "planned"
  | "in_progress"
  | "done"
  | "missed"
  | "cancelled"
  | "skipped";

export type TaskRecurrence = "none" | "daily" | "weekdays" | "weekly";

export interface TaskSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  date: string;
  startTime: string;
  endTime: string;
  status: TaskStatus;
  notes?: string;
  recurrence?: TaskRecurrence;
  isOvernight?: boolean;
  subtasks?: TaskSubtask[];
  referenceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewTaskInput {
  title: string;
  category?: TaskCategory;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
  recurrence?: TaskRecurrence;
  subtasks?: TaskSubtask[];
  referenceId?: string;
}

export interface CategoryTimeDistribution {
  category: TaskCategory;
  taskCount: number;
  totalMinutes: number;
  completedMinutes: number;
}

export interface RoutineStats {
  totalTasks: number;
  completedTasks: number;
  plannedTasks: number;
  inProgressTasks: number;
  skippedTasks: number;
  completionRate: number;
  totalScheduledMinutes: number;
  completedMinutes: number;
  completedTodayCount: number;
  totalTodayCount: number;
  todayCompletionRate: number;
  categoryDistribution: CategoryTimeDistribution[];
  weeklyTrends: { date: string; total: number; completed: number }[];
}

export interface TaskHistoryQuery {
  startDate?: string;
  endDate?: string;
  category?: TaskCategory | "all";
  status?: TaskStatus | "all";
  search?: string;
}

export type HabitType = "water" | "walking" | "prayer" | "timed" | "boolean";

export type HabitCategory =
  | "health"
  | "learning"
  | "productivity"
  | "mindfulness"
  | "fitness"
  | "general";

// --- Type-specific configs ---
export interface WaterHabitConfig {
  type: "water";
  dailyGoalMl: number;
  sessionPresetsMl: number[];
  reminderIntervalMin?: number;
}

export interface WalkingHabitConfig {
  type: "walking";
  dailyGoal: number;
  unit: "steps" | "km";
}

export interface PrayerHabitConfig {
  type: "prayer";
  prayers: { name: string; time: string }[];
}

export interface TimedHabitConfig {
  type: "timed";
  dailyGoalMinutes: number;
}

export interface BooleanHabitConfig {
  type: "boolean";
}

export type HabitConfig =
  | WaterHabitConfig
  | WalkingHabitConfig
  | PrayerHabitConfig
  | TimedHabitConfig
  | BooleanHabitConfig;

// --- Core domain types ---
export interface HabitDefinition {
  id: string;
  name: string;
  type: HabitType;
  category: HabitCategory;
  icon?: string;
  color?: string;
  config: HabitConfig;
  archived: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface NewHabitDefinitionInput {
  name: string;
  type: HabitType;
  category?: HabitCategory;
  icon?: string;
  color?: string;
  config: HabitConfig;
}

export interface UpdateHabitDefinitionInput {
  name?: string;
  category?: HabitCategory;
  icon?: string;
  color?: string;
  config?: HabitConfig;
}

export interface HabitLogEntry {
  id: string;
  habitId: string;
  date: string;
  value: number;
  meta?: string;
  loggedAt: string;
}

export interface NewHabitLogEntryInput {
  habitId: string;
  date: string;
  value: number;
  meta?: string;
}

// --- Progress & analytics ---
export interface HabitDailyProgress {
  habit: HabitDefinition;
  date: string;
  currentValue: number;
  targetValue: number;
  progress: number; // 0 to 1
  logs: HabitLogEntry[];
  currentStreak: number;
  longestStreak: number;
}

export interface HabitAnalyticsData {
  habitId: string;
  period: "week" | "month";
  dailyValues: { date: string; value: number; target: number }[];
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  totalValue: number;
  averageValue: number;
}

export interface WeeklyHabitSummary {
  habitId: string;
  name: string;
  type: HabitType;
  category: HabitCategory;
  completionCount: number;
  targetCount: number;
  completionRate: number;
}

export interface DailyCompletion {
  date: string;
  completions: number;
}

export interface WeeklySummary {
  habits: WeeklyHabitSummary[];
  dailyBreakdown: DailyCompletion[];
  topHabits: WeeklyHabitSummary[];
  overallCompletionRate: number;
}

// --- Backward compat aliases (used during transition) ---
/** @deprecated Use HabitDefinition */
export type Habit = HabitDefinition;
/** @deprecated Use NewHabitDefinitionInput */
export type NewHabitInput = NewHabitDefinitionInput;
/** @deprecated Use HabitLogEntry */
export type HabitLog = HabitLogEntry;
/** @deprecated Use NewHabitLogEntryInput */
export type NewHabitLogInput = NewHabitLogEntryInput;
export type HabitFrequency = "daily" | "weekly";

export interface HabitWithStreak extends HabitDefinition {
  currentStreak: number;
  longestStreak: number;
  loggedToday: boolean;
  todayProgress: number;
  todayValue: number;
  todayTarget: number;
  logs?: HabitLogEntry[];
}

export interface HabitStats {
  habitId: string;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
}

export interface DashboardSummary {
  now: Task | null;
  next: Task | null;
  todayCount: number;
  todayDoneCount: number;
  dueHabits: HabitWithStreak[];
}

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "legs"
  | "core"
  | "cardio"
  | "general";

export type EquipmentType = "bodyweight" | "dumbbell" | "barbell" | "machine" | "cable" | "other";

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment?: EquipmentType;
  videoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewExerciseInput {
  name: string;
  muscleGroup?: MuscleGroup;
  equipment?: EquipmentType;
  videoUrl?: string;
}

export interface Workout {
  id: string;
  name: string;
  description?: string;
  scheduledDay?: DayOfWeek;
  scheduledTime?: string;
  exerciseCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface NewWorkoutInput {
  name: string;
  description?: string;
  scheduledDay?: DayOfWeek;
  scheduledTime?: string;
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  sets: number;
  reps: number;
  repsArray?: number[];
  weight?: number;
  weights?: number[];
  restSeconds: number;
  orderIndex: number;
  createdAt: string;
}

export interface NewWorkoutExerciseInput {
  exerciseId?: string;
  sets?: number;
  reps?: number;
  repsArray?: number[];
  weight?: number;
  weights?: number[];
  restSeconds?: number;
  orderIndex?: number;
}

export interface WorkoutSession {
  id: string;
  workoutId: string;
  startedAt: string;
  completedAt?: string;
  durationSeconds?: number;
  notes?: string;
}

export interface ExerciseLog {
  id: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  actualReps: number;
  actualWeight?: number;
  completedAt: string;
}

export interface NewExerciseLogInput {
  exerciseId: string;
  setNumber: number;
  actualReps: number;
  actualWeight?: number;
}

export interface WorkoutWithExercises extends Workout {
  exercises: WorkoutExercise[];
}

export interface WorkoutSessionWithLogs extends WorkoutSession {
  logs: ExerciseLog[];
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalSessions: number;
  totalDuration: number;
  averageDuration: number;
  lastWorkoutDate?: string;
}

export interface ExerciseProgressPoint {
  sessionId: string;
  date: string;
  maxWeight: number;
  avgReps: number;
  totalSets: number;
}

export type AccountType = "cash" | "bank" | "card" | "savings" | "mfs";

export type CategoryKind = "income" | "expense";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewAccountInput {
  name: string;
  type: AccountType;
  initialBalanceMinor?: number;
}

export const SYSTEM_CATEGORY_TRANSFER_IN_ID = "cat-system-transfer-in";
export const SYSTEM_CATEGORY_TRANSFER_OUT_ID = "cat-system-transfer-out";
export const SYSTEM_CATEGORY_OPENING_BALANCE_ID = "cat-system-opening-balance";
export const SYSTEM_CATEGORY_OPENING_BALANCE_EXPENSE_ID = "cat-system-opening-balance-expense";

export const DEFAULT_FINANCE_CATEGORIES = [
  {
    id: SYSTEM_CATEGORY_TRANSFER_IN_ID,
    name: "Transfer In",
    kind: "income" as const,
    isSystem: true,
  },
  {
    id: SYSTEM_CATEGORY_TRANSFER_OUT_ID,
    name: "Transfer Out",
    kind: "expense" as const,
    isSystem: true,
  },
  {
    id: SYSTEM_CATEGORY_OPENING_BALANCE_ID,
    name: "Opening Balance",
    kind: "income" as const,
    isSystem: true,
  },
  {
    id: SYSTEM_CATEGORY_OPENING_BALANCE_EXPENSE_ID,
    name: "Opening Balance (Liability)",
    kind: "expense" as const,
    isSystem: true,
  },
] as const;

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  isSystem: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewCategoryInput {
  name: string;
  kind: CategoryKind;
  isSystem?: boolean;
}

export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string;
  date: string;
  amountMinor: number;
  currency: string;
  note?: string;
  transferPairId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewTransactionInput {
  accountId: string;
  categoryId: string;
  date: string;
  amountMinor: number;
  currency?: string;
  note?: string;
  transferPairId?: string;
}

export interface MonthlySummary {
  yearMonth: string;
  totalIncome: number;
  totalExpense: number;
  net: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  kind: CategoryKind;
  total: number;
}

export interface AccountWithBalance extends Account {
  balance: number;
}

export interface FinanceDashboardWidget {
  summary: MonthlySummary;
  topExpenses: CategoryBreakdown[];
}

export interface SkillArea {
  id: string;
  name: string;
  weeklyGoalHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface NewSkillAreaInput {
  name: string;
  weeklyGoalHours?: number;
}

export type LearningResourceType = "course" | "book" | "project" | "article";
export type LearningUnit = "chapters" | "videos" | "hours";

export interface LearningResource {
  id: string;
  skillAreaId: string;
  title: string;
  type: LearningResourceType;
  totalUnits?: number;
  unit?: LearningUnit;
  createdAt: string;
  updatedAt: string;
}

export interface NewLearningResourceInput {
  skillAreaId: string;
  title: string;
  type: LearningResourceType;
  totalUnits?: number;
  unit?: LearningUnit;
}

export interface LearningLog {
  id: string;
  resourceId: string;
  date: string;
  minutesSpent: number;
  unitsCompleted?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewLearningLogInput {
  resourceId: string;
  date: string;
  minutesSpent: number;
  unitsCompleted?: number;
  notes?: string;
}

export interface UpdateSkillAreaInput {
  name?: string;
  weeklyGoalHours?: number;
}

export interface UpdateLearningResourceInput {
  skillAreaId?: string;
  title?: string;
  type?: LearningResourceType;
  totalUnits?: number | null;
  unit?: LearningUnit | null;
}

export interface UpdateLearningLogInput {
  date?: string;
  minutesSpent?: number;
  unitsCompleted?: number | null;
  notes?: string | null;
}

export interface ResourceWithProgress extends LearningResource {
  totalMinutesSpent: number;
  totalUnitsCompleted: number;
  completionPercent: number;
  skillAreaName: string;
}

export interface SkillAreaSummary {
  skillArea: SkillArea;
  totalResources: number;
  totalMinutesSpent: number;
  totalSessions: number;
}

// --- Enriched Dashboard Summary ---
export interface DashboardHabitConsistency {
  habitId: string;
  name: string;
  color: string;
  days: number[]; // 0-100 completion % for last 7 days
  currentStreak: number;
  weekAverage: number;
}

export interface DashboardWorkoutDay {
  day: string;
  [workoutName: string]: string | number;
}

export interface DashboardSkillProgress {
  skillAreaId: string;
  name: string;
  hoursThisWeek: number;
  weeklyGoalHours: number;
  pct: number;
}

export interface DashboardSummary {
  now: Task | null;
  next: Task | null;
  todayCount: number;
  todayDoneCount: number;
  dueHabits: HabitWithStreak[];
  previous: Task | null;
  habitConsistency: DashboardHabitConsistency[];
  workoutWeek: DashboardWorkoutDay[];
  workoutLabels: string[];
  skillsProgress: DashboardSkillProgress[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface UpdateProfileInput {
  name?: string;
  email?: string;
}

export interface SystemSettings {
  theme?: "dark" | "light" | "system";
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// DataSource interface — the contract both `api` and `localDal` must satisfy.
// Uses the wider parameter/return types so both surfaces compile.
// ---------------------------------------------------------------------------
export interface DataSource {
  // Dashboard
  getSummary(date?: string): Promise<DashboardSummary>;

  // Routine — tasks
  getTasks(date: string): Promise<Task[]>;
  createTask(input: NewTaskInput): Promise<{ task: Task; overlapsWith: Task[] }>;
  updateTaskStatus(id: string, status: TaskStatus): Promise<Task>;
  updateTask(
    id: string,
    patch: Partial<NewTaskInput>,
  ): Promise<{ task: Task; overlapsWith: Task[] }>;
  deleteTask(id: string): Promise<void>;
  getTaskHistory(query?: TaskHistoryQuery): Promise<Task[]>;
  getRoutineStats(): Promise<RoutineStats>;

  // Routine — categories
  getRoutineCategories(): Promise<RoutineCategory[]>;
  createRoutineCategory(input: NewRoutineCategoryInput): Promise<RoutineCategory>;
  updateRoutineCategory(id: string, patch: UpdateRoutineCategoryInput): Promise<RoutineCategory>;
  deleteRoutineCategory(
    id: string,
    fallback?: string,
  ): Promise<{ success: boolean; reassignedCount: number }>;

  // Habits
  getHabits(): Promise<HabitDefinition[]>;
  getHabit(id: string): Promise<HabitDefinition>;
  createHabit(input: NewHabitDefinitionInput): Promise<HabitDefinition>;
  updateHabit(id: string, patch: Partial<HabitDefinition>): Promise<HabitDefinition>;
  deleteHabit(id: string): Promise<void>;
  archiveHabit(id: string, archived: boolean): Promise<void>;
  reorderHabits(orders: { id: string; sortOrder: number }[]): Promise<void>;
  logHabit(habitId: string, date?: string, value?: number, meta?: string): Promise<HabitLogEntry>;
  unlogHabit(habitId: string, date: string): Promise<void>;
  unlogHabitByLogId(logId: string): Promise<void>;
  getHabitLogs(habitId: string, date: string): Promise<HabitLogEntry[]>;
  getTodayHabits(date?: string): Promise<HabitWithStreak[]>;
  getHabitStats(id: string, startDate: string, endDate: string): Promise<HabitStats>;
  getHabitAnalytics(
    id: string,
    period?: "week" | "month",
    endDate?: string,
  ): Promise<HabitAnalyticsData | undefined>;
  getWeeklyReview(weekStart?: string): Promise<WeeklySummary>;

  // Skills
  getSkillAreas(): Promise<SkillArea[]>;
  createSkillArea(input: NewSkillAreaInput): Promise<SkillArea>;
  updateSkillArea(id: string, patch: UpdateSkillAreaInput): Promise<SkillArea>;
  deleteSkillArea(id: string): Promise<void>;
  getSkillAreaSummary(areaId: string): Promise<SkillAreaSummary>;
  getLearningResources(): Promise<LearningResource[]>;
  getResourcesByArea(areaId: string): Promise<LearningResource[]>;
  createLearningResource(input: NewLearningResourceInput): Promise<LearningResource>;
  updateLearningResource(id: string, patch: UpdateLearningResourceInput): Promise<LearningResource>;
  deleteLearningResource(id: string): Promise<void>;
  getResourceProgress(id: string): Promise<ResourceWithProgress>;
  logLearningSession(input: NewLearningLogInput): Promise<LearningLog>;
  updateLearningLog(id: string, patch: UpdateLearningLogInput): Promise<LearningLog>;
  deleteLearningLog(id: string): Promise<void>;
  getLearningLogsByResource(resourceId: string): Promise<LearningLog[]>;
  getLearningLogsByRange(startDate: string, endDate: string): Promise<LearningLog[]>;
  getProgressBatch(resourceIds: string[]): Promise<ResourceWithProgress[]>;

  // Finance
  getAccounts(): Promise<AccountWithBalance[]>;
  getActiveAccounts(): Promise<Account[]>;
  getAccount(id: string): Promise<Account | null>;
  getAccountBalance(id: string): Promise<number>;
  getAccountBalances(): Promise<AccountWithBalance[]>;
  createAccount(input: NewAccountInput): Promise<Account>;
  updateAccount(id: string, patch: Partial<NewAccountInput>): Promise<Account>;
  archiveAccount(id: string): Promise<void>;
  unarchiveAccount(id: string): Promise<void>;
  deleteAccount(id: string): Promise<void>;
  getCategories(): Promise<Category[]>;
  getActiveCategories(): Promise<Category[]>;
  getIncomeCategories(): Promise<Category[]>;
  getExpenseCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | null>;
  createCategory(input: NewCategoryInput): Promise<Category>;
  updateCategory(id: string, patch: Partial<NewCategoryInput>): Promise<Category>;
  archiveCategory(id: string): Promise<void>;
  unarchiveCategory(id: string): Promise<void>;
  deleteCategory(id: string): Promise<void>;
  getTransactions(accountId?: string): Promise<Transaction[]>;
  getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]>;
  getTransactionsByAccount(accountId: string): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | null>;
  createTransaction(input: NewTransactionInput): Promise<Transaction>;
  updateTransaction(id: string, patch: Partial<NewTransactionInput>): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;
  createTransfer(
    fromAccountId: string,
    toAccountId: string,
    amountMinor: number,
    date: string,
    note?: string,
  ): Promise<{ from: Transaction; to: Transaction }>;
  getMonthlySummary(yearMonth: string): Promise<MonthlySummary>;
  getCategoryBreakdown(yearMonth: string): Promise<CategoryBreakdown[]>;
  getMonthlyTransactions(yearMonth: string): Promise<Transaction[]>;
  getFinanceWidget(): Promise<FinanceDashboardWidget>;

  // Workouts
  getWorkouts(): Promise<Workout[]>;
  getWorkout(id: string): Promise<WorkoutWithExercises>;
  createWorkout(input: NewWorkoutInput): Promise<Workout>;
  updateWorkout(id: string, patch: Partial<NewWorkoutInput>): Promise<Workout>;
  deleteWorkout(id: string): Promise<void>;
  addExerciseToWorkout(
    workoutId: string,
    exerciseId: string,
    input: NewWorkoutExerciseInput,
  ): Promise<WorkoutExercise>;
  updateWorkoutExercise(
    workoutId: string,
    exerciseId: string,
    patch: Partial<NewWorkoutExerciseInput>,
  ): Promise<WorkoutExercise>;
  removeExerciseFromWorkout(workoutId: string, exerciseId: string): Promise<void>;
  reorderWorkoutExercises(workoutId: string, exerciseIds: string[]): Promise<void>;
  getExercises(): Promise<Exercise[]>;
  getExercise(id: string): Promise<Exercise>;
  createExercise(input: NewExerciseInput): Promise<Exercise>;
  updateExercise(id: string, patch: Partial<NewExerciseInput>): Promise<Exercise>;
  deleteExercise(id: string): Promise<void>;
  getWorkoutSessions(): Promise<WorkoutSession[]>;
  getWorkoutSession(id: string): Promise<WorkoutSessionWithLogs>;
  startWorkoutSession(workoutId: string): Promise<WorkoutSession>;
  completeWorkoutSession(
    id: string,
    durationSeconds: number,
    notes?: string,
  ): Promise<WorkoutSession>;
  deleteWorkoutSession(id: string): Promise<void>;
  cancelWorkoutSession(sessionId: string): Promise<void>;
  addExerciseLog(sessionId: string, input: NewExerciseLogInput): Promise<ExerciseLog>;
  getExerciseLogs(sessionId: string): Promise<ExerciseLog[]>;
  getWorkoutHistory(): Promise<WorkoutSession[]>;
  getWorkoutStats(): Promise<WorkoutStats>;
  getRecentWorkoutSessions(limit?: number): Promise<WorkoutSession[]>;
  getExerciseProgress(exerciseId: string): Promise<ExerciseProgressPoint[]>;

  // Profile & Settings
  updateProfile(input: {
    name?: string;
    email?: string;
  }): Promise<{ user: { id: string; name: string; email: string; createdAt?: string } }>;
  getSettings(): Promise<Record<string, string>>;
  updateSettings(settings: Record<string, string>): Promise<Record<string, string>>;
  getHealth(): Promise<{ status: string; timestamp: string; version?: string }>;
}

export {
  getClientCurrentMinute,
  getClientDateString,
  getClientMonthString,
  getDayOfWeekIndex,
  isValidDateString,
  isWeekday,
} from "./date-utils.js";

export * from "./schemas.js";
