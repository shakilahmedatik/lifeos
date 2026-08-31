import type {
  Account,
  AccountWithBalance,
  Category,
  CategoryBreakdown,
  DashboardSummary,
  Exercise,
  ExerciseLog,
  ExerciseProgressPoint,
  FinanceDashboardWidget,
  HabitAnalyticsData,
  HabitDefinition,
  HabitLogEntry,
  HabitStats,
  HabitWithStreak,
  MonthlySummary,
  NewAccountInput,
  NewCategoryInput,
  NewExerciseInput,
  NewExerciseLogInput,
  NewHabitDefinitionInput,
  NewNotificationInput,
  NewReminderInput,
  NewRoutineCategoryInput,
  NewsArticle,
  NewTransactionInput,
  NewWorkoutExerciseInput,
  NewWorkoutInput,
  Notification,
  NotificationSoundType,
  NotificationWithTask,
  Reminder,
  RoutineCategory,
  RoutineStats,
  RssFeed,
  Task,
  TaskHistoryQuery,
  Transaction,
  UpdateReminderInput,
  UpdateRoutineCategoryInput,
  WeeklySummary,
  Workout,
  WorkoutExercise,
  WorkoutSession,
  WorkoutSessionWithLogs,
  WorkoutStats,
  WorkoutWithExercises,
} from "@lifeos/contracts";

import { log } from "./logger.js";
import { isTauri } from "./platform.js";

const apiLog = log.child("api");

export function getApiBaseUrl(): string {
  if (isTauri()) {
    return import.meta.env.DEV ? "http://127.0.0.1:3000" : "https://api-lifeos.shatik.me";
  }
  return import.meta.env.DEV ? "" : import.meta.env.VITE_API_URL || "";
}

export async function request<T>(url: string, options?: RequestInit): Promise<T> {
  let token =
    typeof localStorage !== "undefined" ? localStorage.getItem("lifeos_session_token") : null;

  if (token) {
    try {
      token = JSON.parse(token);
    } catch {
      // Keep raw token if parsing fails
    }
  }

  if (token === "session-token" || token === "null" || token === "undefined") {
    token = null;
  }

  const headers = new Headers(options?.headers);
  if (options?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (isTauri() && !headers.has("Origin")) {
    headers.set("Origin", "tauri://localhost");
  }

  const baseUrl = getApiBaseUrl();
  const fullUrl = url.startsWith("/api/") ? `${baseUrl}${url}` : url;
  const method = options?.method || "GET";

  const fetchOptions: RequestInit = { ...options, headers };
  if (!isTauri()) {
    fetchOptions.credentials = "include";
  }

  apiLog.debug(`→ ${method} ${url}`);
  const start = performance.now();

  let res: Response;
  try {
    res = await fetch(fullUrl, fetchOptions);
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    apiLog.error(`✖ ${method} ${url} — Network error`, {
      error: (err as Error).message,
      duration: `${duration}ms`,
    });
    throw err;
  }

  const duration = Math.round(performance.now() - start);

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    apiLog.error(`← ${method} ${url}`, {
      status: res.status,
      duration: `${duration}ms`,
      body: body.slice(0, 500) || res.statusText,
    });
    throw new Error(`API error ${res.status}: ${body || res.statusText}`);
  }

  apiLog.info(`← ${method} ${url}`, { status: res.status, duration: `${duration}ms` });

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // Dashboard
  getSummary: (date?: string) => {
    const d = date || new Date().toISOString().split("T")[0];
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const localIso = `${d}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    return request<DashboardSummary>(
      `/api/dashboard/summary?date=${d}&nowIso=${encodeURIComponent(localIso)}`,
    );
  },

  // Routine
  getTasks: (date: string) => request<Task[]>(`/api/routine/tasks?date=${date}`),
  createTask: (input: import("@lifeos/contracts").NewTaskInput) =>
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
  updateTask: (id: string, patch: Partial<import("@lifeos/contracts").NewTaskInput>) =>
    request<{ task: Task; overlapsWith: Task[] }>(`/api/routine/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
  deleteTask: (id: string) => request<void>(`/api/routine/tasks/${id}`, { method: "DELETE" }),
  getTaskHistory: (query?: TaskHistoryQuery) => {
    const params = new URLSearchParams();
    if (query?.startDate) params.set("startDate", query.startDate);
    if (query?.endDate) params.set("endDate", query.endDate);
    if (query?.category) params.set("category", query.category);
    if (query?.status) params.set("status", query.status);
    if (query?.search) params.set("search", query.search);
    const qs = params.toString();
    return request<Task[]>(`/api/routine/tasks/history${qs ? `?${qs}` : ""}`);
  },
  getRoutineStats: () => request<RoutineStats>("/api/routine/stats"),
  getRoutineCategories: () => request<RoutineCategory[]>("/api/routine/categories"),
  createRoutineCategory: (input: NewRoutineCategoryInput) =>
    request<RoutineCategory>("/api/routine/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  updateRoutineCategory: (id: string, patch: UpdateRoutineCategoryInput) =>
    request<RoutineCategory>(`/api/routine/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
  deleteRoutineCategory: (id: string, fallback = "general") =>
    request<{ success: boolean; reassignedCount: number }>(
      `/api/routine/categories/${id}?fallback=${fallback}`,
      { method: "DELETE" },
    ),

  // Habits
  getHabits: () => request<HabitDefinition[]>("/api/habits"),
  getHabit: (id: string) => request<HabitDefinition>(`/api/habits/${id}`),
  createHabit: (input: NewHabitDefinitionInput) =>
    request<HabitDefinition>("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  updateHabit: (id: string, patch: Partial<HabitDefinition>) =>
    request<HabitDefinition>(`/api/habits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
  deleteHabit: (id: string) => request<void>(`/api/habits/${id}`, { method: "DELETE" }),
  archiveHabit: (id: string, archived: boolean) =>
    request<void>(`/api/habits/${id}/archive`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived }),
    }),
  reorderHabits: (orders: { id: string; sortOrder: number }[]) =>
    request<void>("/api/habits/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orders }),
    }),
  logHabit: (habitId: string, date?: string, value = 1, meta?: string) =>
    request<HabitLogEntry>(`/api/habits/${habitId}/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: date || new Date().toISOString().split("T")[0], value, meta }),
    }),
  unlogHabit: (habitId: string, date: string) =>
    request<void>(`/api/habits/${habitId}/log/${date}`, { method: "DELETE" }),
  unlogHabitByLogId: (logId: string) =>
    request<void>(`/api/habits/log/${logId}`, { method: "DELETE" }),
  getHabitLogs: (habitId: string, date: string) =>
    request<HabitLogEntry[]>(`/api/habits/${habitId}/logs?date=${date}`),
  getTodayHabits: () => request<HabitWithStreak[]>("/api/habits/today"),
  getHabitStats: (id: string, startDate: string, endDate: string) =>
    request<HabitStats>(`/api/habits/${id}/stats?startDate=${startDate}&endDate=${endDate}`),
  getHabitAnalytics: (id: string, period: "week" | "month" = "week", endDate?: string) =>
    request<HabitAnalyticsData>(
      `/api/habits/${id}/analytics?period=${period}${endDate ? `&endDate=${endDate}` : ""}`,
    ),
  getWeeklyReview: (weekStart?: string) =>
    request<WeeklySummary>(
      `/api/habits/weekly-review${weekStart ? `?weekStart=${weekStart}` : ""}`,
    ),
  exportHabits: () => request<{ habits: HabitDefinition[] }>("/api/habits/export"),
  importHabits: (data: unknown) =>
    request<void>("/api/habits/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  // Skills
  getSkillAreas: () => request<import("@lifeos/contracts").SkillArea[]>("/api/skills/areas"),
  createSkillArea: (input: import("@lifeos/contracts").NewSkillAreaInput) =>
    request<import("@lifeos/contracts").SkillArea>("/api/skills/areas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  updateSkillArea: (id: string, patch: import("@lifeos/contracts").UpdateSkillAreaInput) =>
    request<import("@lifeos/contracts").SkillArea>(`/api/skills/areas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
  deleteSkillArea: (id: string) => request<void>(`/api/skills/areas/${id}`, { method: "DELETE" }),
  getSkillAreaSummary: (areaId: string) =>
    request<import("@lifeos/contracts").SkillAreaSummary>(`/api/skills/summary/${areaId}`),
  getLearningResources: () =>
    request<import("@lifeos/contracts").LearningResource[]>("/api/skills/resources"),
  getResourcesByArea: (areaId: string) =>
    request<import("@lifeos/contracts").LearningResource[]>(
      `/api/skills/resources/by-area/${areaId}`,
    ),
  createLearningResource: (input: import("@lifeos/contracts").NewLearningResourceInput) =>
    request<import("@lifeos/contracts").LearningResource>("/api/skills/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  updateLearningResource: (
    id: string,
    patch: import("@lifeos/contracts").UpdateLearningResourceInput,
  ) =>
    request<import("@lifeos/contracts").LearningResource>(`/api/skills/resources/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
  deleteLearningResource: (id: string) =>
    request<void>(`/api/skills/resources/${id}`, { method: "DELETE" }),
  getResourceProgress: (id: string) =>
    request<import("@lifeos/contracts").ResourceWithProgress>(
      `/api/skills/resources/${id}/progress`,
    ),
  logLearningSession: (input: import("@lifeos/contracts").NewLearningLogInput) =>
    request<import("@lifeos/contracts").LearningLog>("/api/skills/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  updateLearningLog: (id: string, patch: import("@lifeos/contracts").UpdateLearningLogInput) =>
    request<import("@lifeos/contracts").LearningLog>(`/api/skills/logs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
  deleteLearningLog: (id: string) => request<void>(`/api/skills/logs/${id}`, { method: "DELETE" }),
  getLearningLogsByResource: (resourceId: string) =>
    request<import("@lifeos/contracts").LearningLog[]>(
      `/api/skills/logs/by-resource/${resourceId}`,
    ),
  getLearningLogsByRange: (startDate: string, endDate: string) =>
    request<import("@lifeos/contracts").LearningLog[]>(
      `/api/skills/logs/range?startDate=${startDate}&endDate=${endDate}`,
    ),
  // Skills import
  importBackup: (input: {
    areas: import("@lifeos/contracts").NewSkillAreaInput[];
    resources: import("@lifeos/contracts").NewLearningResourceInput[];
    logs: import("@lifeos/contracts").NewLearningLogInput[];
  }) =>
    request<{
      success: boolean;
      areasCreated: number;
      resourcesCreated: number;
      logsCreated: number;
    }>("/api/skills/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  getProgressBatch: (resourceIds: string[]) =>
    request<import("@lifeos/contracts").ResourceWithProgress[]>(
      "/api/skills/resources/progress-batch",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceIds }),
      },
    ),

  // Finance
  getAccounts: () => request<AccountWithBalance[]>("/api/finance/accounts"),
  getActiveAccounts: () => request<Account[]>("/api/finance/accounts/active"),
  getAccount: (id: string) => request<Account>(`/api/finance/accounts/${id}`),
  getAccountBalance: async (id: string) => {
    const data = await request<{ balance: number }>(`/api/finance/accounts/${id}/balance`);
    return data.balance;
  },
  getAccountBalances: () => request<AccountWithBalance[]>("/api/finance/balances"),
  createAccount: (input: NewAccountInput) =>
    request<Account>("/api/finance/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  updateAccount: (id: string, patch: Partial<NewAccountInput>) =>
    request<Account>(`/api/finance/accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
  archiveAccount: (id: string) =>
    request<void>(`/api/finance/accounts/${id}/archive`, { method: "POST" }),
  unarchiveAccount: (id: string) =>
    request<void>(`/api/finance/accounts/${id}/unarchive`, { method: "POST" }),
  deleteAccount: (id: string) => request<void>(`/api/finance/accounts/${id}`, { method: "DELETE" }),

  getCategories: () => request<Category[]>("/api/finance/categories"),
  getActiveCategories: () => request<Category[]>("/api/finance/categories/active"),
  getIncomeCategories: () => request<Category[]>("/api/finance/categories/income"),
  getExpenseCategories: () => request<Category[]>("/api/finance/categories/expense"),
  getCategory: (id: string) => request<Category>(`/api/finance/categories/${id}`),
  createCategory: (input: NewCategoryInput) =>
    request<Category>("/api/finance/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  updateCategory: (id: string, patch: Partial<NewCategoryInput>) =>
    request<Category>(`/api/finance/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
  archiveCategory: (id: string) =>
    request<void>(`/api/finance/categories/${id}/archive`, { method: "POST" }),
  unarchiveCategory: (id: string) =>
    request<void>(`/api/finance/categories/${id}/unarchive`, { method: "POST" }),
  deleteCategory: (id: string) =>
    request<void>(`/api/finance/categories/${id}`, { method: "DELETE" }),

  getTransactions: (accountId?: string) =>
    request<Transaction[]>(
      `/api/finance/transactions${accountId ? `?accountId=${accountId}` : ""}`,
    ),
  getTransactionsByDateRange: (startDate: string, endDate: string) =>
    request<Transaction[]>(`/api/finance/transactions?startDate=${startDate}&endDate=${endDate}`),
  getTransactionsByAccount: (accountId: string) =>
    request<Transaction[]>(`/api/finance/transactions?accountId=${accountId}`),
  getTransaction: (id: string) => request<Transaction>(`/api/finance/transactions/${id}`),
  createTransaction: (input: NewTransactionInput) =>
    request<Transaction>("/api/finance/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  updateTransaction: (id: string, patch: Partial<NewTransactionInput>) =>
    request<Transaction>(`/api/finance/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
  deleteTransaction: (id: string) =>
    request<void>(`/api/finance/transactions/${id}`, { method: "DELETE" }),
  createTransfer: (
    fromAccountId: string,
    toAccountId: string,
    amountMinor: number,
    date: string,
    note?: string,
  ) =>
    request<{ from: Transaction; to: Transaction }>("/api/finance/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromAccountId, toAccountId, amountMinor, date, note }),
    }),

  getMonthlySummary: (yearMonth: string) =>
    request<MonthlySummary>(`/api/finance/monthly/${yearMonth}`),
  getCategoryBreakdown: (yearMonth: string) =>
    request<CategoryBreakdown[]>(`/api/finance/monthly/${yearMonth}/breakdown`),
  getMonthlyTransactions: (yearMonth: string) =>
    request<Transaction[]>(`/api/finance/monthly/${yearMonth}/transactions`),
  getFinanceWidget: async (): Promise<FinanceDashboardWidget> => {
    const now = new Date().toISOString().split("T")[0].substring(0, 7);
    const [summary, breakdown] = await Promise.all([
      api.getMonthlySummary(now),
      api.getCategoryBreakdown(now),
    ]);
    return {
      summary,
      topExpenses: breakdown.filter((e) => e.kind === "expense"),
    };
  },

  // Backup
  downloadBackup: () => request<{ filename: string; path: string }>("/api/backup"),
  exportBackupJson: async () => {
    const token =
      typeof localStorage !== "undefined" ? localStorage.getItem("lifeos_session_token") : null;
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${getApiBaseUrl()}/api/backup/export`, {
      headers,
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to export database backup");
    return res.blob();
  },

  // Notifications
  getNotifications: () => request<NotificationWithTask[]>("/api/notifications"),
  getDueNotifications: () => request<NotificationWithTask[]>("/api/notifications/due"),
  getUnreadCount: () => request<{ count: number }>("/api/notifications/unread-count"),
  createNotification: (input: NewNotificationInput) =>
    request<Notification>("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  deleteNotification: (id: string) =>
    request<void>(`/api/notifications/${id}`, { method: "DELETE" }),
  deleteNotificationsByTaskId: (taskId: string) =>
    request<void>(`/api/notifications/task/${taskId}`, { method: "DELETE" }),
  getSoundSettings: () =>
    request<{ soundType: NotificationSoundType }>("/api/notifications/settings/sound"),
  updateSoundSettings: (soundType: NotificationSoundType) =>
    request<{ soundType: NotificationSoundType }>("/api/notifications/settings/sound", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ soundType }),
    }),

  // Reminders
  getReminders: (date?: string) =>
    request<Reminder[]>(`/api/reminders${date ? `?date=${date}` : ""}`),
  getTodayReminders: () => request<Reminder[]>("/api/reminders/today"),
  createReminder: (input: NewReminderInput) =>
    request<Reminder>("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  updateReminder: (id: string, patch: UpdateReminderInput) =>
    request<Reminder>(`/api/reminders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
  deleteReminder: (id: string) => request<void>(`/api/reminders/${id}`, { method: "DELETE" }),

  // Workouts
  getWorkouts: () => request<Workout[]>("/api/workouts"),
  getWorkout: (id: string) => request<WorkoutWithExercises>(`/api/workouts/${id}`),
  createWorkout: (input: NewWorkoutInput) =>
    request<Workout>("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  updateWorkout: (id: string, patch: Partial<NewWorkoutInput>) =>
    request<Workout>(`/api/workouts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
  deleteWorkout: (id: string) => request<void>(`/api/workouts/${id}`, { method: "DELETE" }),
  addExerciseToWorkout: (workoutId: string, exerciseId: string, input: NewWorkoutExerciseInput) =>
    request<WorkoutExercise>(`/api/workouts/${workoutId}/exercises`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, exerciseId }),
    }),
  updateWorkoutExercise: (
    workoutId: string,
    exerciseId: string,
    patch: Partial<NewWorkoutExerciseInput>,
  ) =>
    request<WorkoutExercise>(`/api/workouts/${workoutId}/exercises/${exerciseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
  removeExerciseFromWorkout: (workoutId: string, exerciseId: string) =>
    request<void>(`/api/workouts/${workoutId}/exercises/${exerciseId}`, { method: "DELETE" }),
  reorderWorkoutExercises: (workoutId: string, exerciseIds: string[]) =>
    request<void>(`/api/workouts/${workoutId}/exercises/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exerciseIds }),
    }),
  getExercises: () => request<Exercise[]>("/api/workouts/exercises"),
  getExercise: (id: string) => request<Exercise>(`/api/workouts/exercises/${id}`),
  createExercise: (input: NewExerciseInput) =>
    request<Exercise>("/api/workouts/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  updateExercise: (id: string, patch: Partial<NewExerciseInput>) =>
    request<Exercise>(`/api/workouts/exercises/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
  deleteExercise: (id: string) =>
    request<void>(`/api/workouts/exercises/${id}`, { method: "DELETE" }),
  getWorkoutSessions: () => request<WorkoutSession[]>("/api/workouts/sessions"),
  getWorkoutSession: (id: string) =>
    request<WorkoutSessionWithLogs>(`/api/workouts/sessions/${id}`),
  startWorkoutSession: (workoutId: string) =>
    request<WorkoutSession>("/api/workouts/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workoutId }),
    }),
  completeWorkoutSession: (id: string, durationSeconds: number, notes?: string) =>
    request<WorkoutSession>(`/api/workouts/sessions/${id}/complete`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationSeconds, notes }),
    }),
  deleteWorkoutSession: (id: string) =>
    request<void>(`/api/workouts/sessions/${id}`, { method: "DELETE" }),
  cancelWorkoutSession: (sessionId: string) =>
    request<void>(`/api/workouts/sessions/${sessionId}`, { method: "DELETE" }),
  addExerciseLog: (sessionId: string, input: NewExerciseLogInput) =>
    request<ExerciseLog>(`/api/workouts/sessions/${sessionId}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  getExerciseLogs: (sessionId: string) =>
    request<ExerciseLog[]>(`/api/workouts/sessions/${sessionId}/logs`),
  getWorkoutHistory: () => request<WorkoutSession[]>("/api/workouts/history"),
  getWorkoutStats: () => request<WorkoutStats>("/api/workouts/history/stats"),
  getRecentWorkoutSessions: (limit = 10) =>
    request<WorkoutSession[]>(`/api/workouts/history/recent?limit=${limit}`),
  getExerciseProgress: (exerciseId: string) =>
    request<ExerciseProgressPoint[]>(`/api/workouts/exercises/${exerciseId}/progress`),

  // News
  getNewsFeeds: () => request<RssFeed[]>("/api/news/feeds"),
  getNewsFeed: (id: string) => request<RssFeed>(`/api/news/feeds/${id}`),
  createNewsFeed: (input: { title: string; url: string }) =>
    request<RssFeed>("/api/news/feeds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  updateNewsFeed: (id: string, patch: { title?: string; url?: string }) =>
    request<RssFeed>(`/api/news/feeds/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
  deleteNewsFeed: (id: string) => request<void>(`/api/news/feeds/${id}`, { method: "DELETE" }),
  toggleNewsFeedStatus: (id: string) =>
    request<RssFeed>(`/api/news/feeds/${id}/toggle`, { method: "PATCH" }),
  refreshNewsFeed: (id: string) =>
    request<{ newArticles: number }>(`/api/news/feeds/${id}/refresh`, { method: "POST" }),
  refreshAllNewsFeeds: () =>
    request<{ success: boolean; totalFeeds: number; newArticles: number }>(
      "/api/news/feeds/refresh-all",
      {
        method: "POST",
      },
    ),
  getNewsArticles: (params?: {
    feedId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.feedId) searchParams.set("feedId", params.feedId);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.offset) searchParams.set("offset", params.offset.toString());
    const queryString = searchParams.toString();
    return request<NewsArticle[]>(`/api/news/articles${queryString ? `?${queryString}` : ""}`);
  },
  getTickerArticles: () => request<NewsArticle[]>("/api/news/articles/ticker"),
  markNewsArticleAsRead: (id: string) =>
    request<NewsArticle>(`/api/news/articles/${id}/read`, { method: "PATCH" }),

  // User Profile & System Settings
  updateProfile: (input: { name?: string; email?: string }) =>
    request<{ user: { id: string; name: string; email: string; createdAt?: string } }>(
      "/api/auth/profile",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
    ),
  getSettings: () => request<Record<string, string>>("/api/settings"),
  updateSettings: (settings: Record<string, string>) =>
    request<Record<string, string>>("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    }),
  getHealth: () => request<{ status: string; timestamp: string; version?: string }>("/api/health"),
};
