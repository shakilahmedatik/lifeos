import type {
  Account,
  AccountWithBalance,
  BackupInfo,
  Category,
  CategoryBreakdown,
  DashboardSummary,
  Exercise,
  FinanceDashboardWidget,
  Habit,
  HabitLog,
  HabitStats,
  HabitWithStreak,
  LearningLog,
  LearningResource,
  MonthlySummary,
  NewAccountInput,
  NewCategoryInput,
  NewExerciseInput,
  NewHabitInput,
  NewLearningLogInput,
  NewLearningResourceInput,
  NewSkillAreaInput,
  NewTransactionInput,
  NewWorkoutExerciseInput,
  NewWorkoutInput,
  ResourceWithProgress,
  SkillArea,
  Task,
  Transaction,
  WeeklySummary,
  Workout,
  WorkoutExercise,
  WorkoutSession,
  WorkoutSessionWithLogs,
  WorkoutWithExercises,
} from "../../../packages/contracts/src/index.js";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // Dashboard
  getSummary: () => request<DashboardSummary>("/api/dashboard/summary"),

  // Routine
  getTasks: (date: string) => request<Task[]>(`/api/routine/tasks?date=${date}`),
  createTask: (input: import("../../../packages/contracts/src/index.js").NewTaskInput) =>
    request<{ task: Task; overlapsWith: Task[] }>("/api/routine/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  updateTaskStatus: (id: string, status: Task["status"]) =>
    request<Task>(`/api/routine/tasks/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }),
  updateTask: (
    id: string,
    patch: Partial<import("../../../packages/contracts/src/index.js").NewTaskInput>,
  ) =>
    request<Task>(`/api/routine/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
  deleteTask: (id: string) => request<void>(`/api/routine/tasks/${id}`, { method: "DELETE" }),

  // Habits
  getHabits: () => request<Habit[]>("/api/habits"),
  createHabit: (input: NewHabitInput) =>
    request<Habit>("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  updateHabit: (id: string, patch: Partial<NewHabitInput>) =>
    request<Habit>(`/api/habits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
  deleteHabit: (id: string) => request<void>(`/api/habits/${id}`, { method: "DELETE" }),
  logHabit: (habitId: string) =>
    request<HabitLog>(`/api/habits/${habitId}/log`, { method: "POST" }),
  unlogHabit: (habitId: string, date: string) =>
    request<void>(`/api/habits/${habitId}/log/${date}`, { method: "DELETE" }),
  getTodayHabits: () => request<HabitWithStreak[]>("/api/habits/today"),
  getHabitStats: (id: string, startDate: string, endDate: string) =>
    request<HabitStats>(`/api/habits/${id}/stats?startDate=${startDate}&endDate=${endDate}`),
  getWeeklyReview: (weekStart?: string) =>
    request<WeeklySummary>(
      `/api/habits/weekly-review${weekStart ? `?weekStart=${weekStart}` : ""}`,
    ),

  // Skills
  getSkillAreas: () =>
    request<import("../../../packages/contracts/src/index.js").SkillArea[]>("/api/skills/areas"),
  createSkillArea: (input: import("../../../packages/contracts/src/index.js").NewSkillAreaInput) =>
    request<import("../../../packages/contracts/src/index.js").SkillArea>("/api/skills/areas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  getLearningResources: () =>
    request<import("../../../packages/contracts/src/index.js").LearningResource[]>(
      "/api/skills/resources",
    ),
  getResourcesByArea: (areaId: string) =>
    request<import("../../../packages/contracts/src/index.js").LearningResource[]>(
      `/api/skills/resources/by-area/${areaId}`,
    ),
  createLearningResource: (
    input: import("../../../packages/contracts/src/index.js").NewLearningResourceInput,
  ) =>
    request<import("../../../packages/contracts/src/index.js").LearningResource>(
      "/api/skills/resources",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
    ),
  getResourceProgress: (id: string) =>
    request<import("../../../packages/contracts/src/index.js").ResourceWithProgress>(
      `/api/skills/resources/${id}/progress`,
    ),
  logLearningSession: (
    input: import("../../../packages/contracts/src/index.js").NewLearningLogInput,
  ) =>
    request<import("../../../packages/contracts/src/index.js").LearningLog>("/api/skills/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  getLearningLogsByResource: (resourceId: string) =>
    request<import("../../../packages/contracts/src/index.js").LearningLog[]>(
      `/api/skills/logs/by-resource/${resourceId}`,
    ),

  // Workouts
  getWorkouts: () => request<Workout[]>("/api/workouts"),
  createWorkout: (input: NewWorkoutInput) =>
    request<Workout>("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  getExercises: () => request<Exercise[]>("/api/workouts/exercises"),
  getWorkoutWithExercises: (id: string) => request<WorkoutWithExercises>(`/api/workouts/${id}`),
  startSession: (workoutId: string) =>
    request<WorkoutSession>("/api/workouts/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workoutId }),
    }),
  completeSession: (id: string) =>
    request<WorkoutSession>(`/api/workouts/sessions/${id}/complete`, { method: "PATCH" }),
  getSessionWithLogs: (id: string) =>
    request<WorkoutSessionWithLogs>(`/api/workouts/sessions/${id}`),

  // Finance
  getAccounts: () => request<AccountWithBalance[]>("/api/finance/accounts"),
  createAccount: (input: NewAccountInput) =>
    request<Account>("/api/finance/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  getCategories: () => request<Category[]>("/api/finance/categories"),
  createCategory: (input: NewCategoryInput) =>
    request<Category>("/api/finance/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  getTransactions: (accountId?: string) =>
    request<Transaction[]>(
      `/api/finance/transactions${accountId ? `?accountId=${accountId}` : ""}`,
    ),
  createTransaction: (input: NewTransactionInput) =>
    request<Transaction>("/api/finance/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  getMonthlySummary: (yearMonth: string) =>
    request<MonthlySummary>(`/api/finance/reports/monthly?yearMonth=${yearMonth}`),
  getCategoryBreakdown: (yearMonth: string) =>
    request<CategoryBreakdown[]>(`/api/finance/reports/categories?yearMonth=${yearMonth}`),
  getFinanceWidget: () => request<FinanceDashboardWidget>("/api/finance/widget"),

  // Backup
  downloadBackup: () => request<{ filename: string; path: string }>("/api/backup"),
};
