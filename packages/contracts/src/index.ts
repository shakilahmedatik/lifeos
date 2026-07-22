export type TaskCategory = "work" | "workout" | "learning" | "habit" | "personal" | "general";

export type TaskStatus = "planned" | "in_progress" | "done" | "skipped";

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  date: string;
  startTime: string;
  endTime: string;
  status: TaskStatus;
  notes?: string;
  reminderMinutesBefore?: number;
  reminderSound: boolean;
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
  reminderMinutesBefore?: number;
  reminderSound?: boolean;
}

export type HabitFrequency = "daily" | "weekly";

export type HabitCategory =
  | "health"
  | "learning"
  | "productivity"
  | "mindfulness"
  | "fitness"
  | "general";

export interface Habit {
  id: string;
  name: string;
  frequency: HabitFrequency;
  targetCount: number;
  category: HabitCategory;
  createdAt: string;
  updatedAt: string;
}

export interface NewHabitInput {
  name: string;
  frequency?: HabitFrequency;
  targetCount?: number;
  category?: HabitCategory;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  completedAt: string;
}

export interface HabitWithStreak extends Habit {
  currentStreak: number;
  longestStreak: number;
  loggedToday: boolean;
}

export interface HabitStats {
  habitId: string;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
}

export interface WeeklyHabitSummary {
  habitId: string;
  name: string;
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
  videoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewExerciseInput {
  name: string;
  muscleGroup?: MuscleGroup;
  videoUrl?: string;
}

export interface Workout {
  id: string;
  name: string;
  description?: string;
  scheduledDay?: DayOfWeek;
  scheduledTime?: string;
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
  weight?: number;
  restSeconds: number;
  orderIndex: number;
  createdAt: string;
}

export interface NewWorkoutExerciseInput {
  exerciseId: string;
  sets?: number;
  reps?: number;
  weight?: number;
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
