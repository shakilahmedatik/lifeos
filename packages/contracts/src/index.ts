export type TaskCategory =
  | "routine"
  | "must_do"
  | "work"
  | "workout"
  | "learning"
  | "habit"
  | "personal"
  | "general"
  | "flex";

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
  reminderMinutesBefore?: number | null;
  reminderSilent: boolean;
  reminderSound?: NotificationSoundType;
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
  reminderMinutesBefore?: number | null;
  reminderSilent?: boolean;
  reminderSound?: NotificationSoundType;
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
}

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewCategoryInput {
  name: string;
  kind: CategoryKind;
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

export interface BackupInfo {
  filename: string;
  path: string;
  sizeBytes: number;
  createdAt: string;
}

export type FeedStatus = "active" | "inactive";

export interface RssFeed {
  id: string;
  title: string;
  url: string;
  status: FeedStatus;
  lastFetchedAt?: string;
  lastFetchError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewRssFeedInput {
  title: string;
  url: string;
}

export interface NewsArticle {
  id: string;
  feedId: string;
  title: string;
  url: string;
  summary?: string;
  publishedAt?: string;
  fetchedAt: string;
  isRead: boolean;
}

export interface FeedWithArticleCount extends RssFeed {
  articleCount: number;
}

export type NotificationSoundType = "default" | "gentle" | "urgent" | "chime" | "bell";

export type NotificationStatus = "scheduled" | "sent" | "cancelled" | "expired";

export interface Notification {
  id: string;
  taskId: string;
  userId: string;
  reminderTime: string;
  soundType: NotificationSoundType;
  status: NotificationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface NewNotificationInput {
  taskId: string;
  userId?: string;
  reminderTime: string;
  soundType?: NotificationSoundType;
}

export interface UpdateNotificationInput {
  reminderTime?: string;
  soundType?: NotificationSoundType;
  status?: NotificationStatus;
}

export interface NotificationWithTask extends Notification {
  taskTitle: string;
  taskDate: string;
  taskStartTime: string;
}

// --- Reminders ---
export type ReminderKind = "reminder" | "event";

export interface Reminder {
  id: string;
  title: string;
  time: string; // HH:MM
  date: string | null; // YYYY-MM-DD, null = recurring daily
  kind: ReminderKind;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewReminderInput {
  title: string;
  time: string;
  date?: string | null;
  kind?: ReminderKind;
}

export interface UpdateReminderInput {
  title?: string;
  time?: string;
  date?: string | null;
  kind?: ReminderKind;
  completed?: boolean;
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

export interface DashboardNewsItem {
  id: string;
  source: string;
  title: string;
  url: string;
  publishedAt: string | null;
}

export interface DashboardSummary {
  now: Task | null;
  next: Task | null;
  todayCount: number;
  todayDoneCount: number;
  dueHabits: HabitWithStreak[];
  previous: Task | null;
  upcomingReminders: Reminder[];
  habitConsistency: DashboardHabitConsistency[];
  workoutWeek: DashboardWorkoutDay[];
  workoutLabels: string[];
  skillsProgress: DashboardSkillProgress[];
  newsItems: DashboardNewsItem[];
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
  notificationSound?: NotificationSoundType;
  desktopNotifications?: boolean;
  [key: string]: unknown;
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
