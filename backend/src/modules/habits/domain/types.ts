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

export interface NewHabitLogInput {
  habitId: string;
  date: string;
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

export interface WeeklySummary {
  habits: WeeklyHabitSummary[];
  dailyBreakdown: DailyCompletion[];
  topHabits: WeeklyHabitSummary[];
  overallCompletionRate: number;
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
