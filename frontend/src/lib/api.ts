import type {
  Account,
  AccountWithBalance,
  Category,
  CategoryBreakdown,
  DashboardSummary,
  FinanceDashboardWidget,
  Habit,
  HabitLog,
  HabitStats,
  HabitWithStreak,
  MonthlySummary,
  NewAccountInput,
  NewCategoryInput,
  NewHabitInput,
  NewNotificationInput,
  NewTransactionInput,
  Notification,
  Task,
  Transaction,
  WeeklySummary,
} from "@lifeos/contracts";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${body || res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // Dashboard
  getSummary: (date?: string) =>
    request<DashboardSummary>(`/api/dashboard/summary${date ? `?date=${date}` : ""}`),

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
  logHabit: (habitId: string, date?: string) =>
    request<HabitLog>(`/api/habits/${habitId}/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: date ? JSON.stringify({ date }) : undefined,
    }),
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

  // Notifications
  createNotification: (input: NewNotificationInput) =>
    request<Notification>("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  deleteNotificationsByTaskId: (taskId: string) =>
    request<void>(`/api/notifications/task/${taskId}`, { method: "DELETE" }),
};
