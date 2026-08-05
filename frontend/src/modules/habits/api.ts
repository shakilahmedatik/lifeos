import type {
  HabitAnalyticsData,
  HabitDailyProgress,
  HabitDefinition,
  HabitLogEntry,
  NewHabitDefinitionInput,
  WeeklySummary,
} from "@lifeos/contracts";

const BASE = "/api/habits";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${body || res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const habitApi = {
  getHabits: async (activeOnly?: boolean): Promise<HabitDefinition[]> => {
    const query = activeOnly ? "?active=true" : "";
    return request<HabitDefinition[]>(`${BASE}${query}`);
  },

  getHabit: async (id: string): Promise<HabitDefinition> => {
    return request<HabitDefinition>(`${BASE}/${id}`);
  },

  createHabit: async (data: NewHabitDefinitionInput): Promise<HabitDefinition> => {
    return request<HabitDefinition>(BASE, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateHabit: async (id: string, data: Partial<HabitDefinition>): Promise<HabitDefinition> => {
    return request<HabitDefinition>(`${BASE}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteHabit: async (id: string): Promise<void> => {
    return request<void>(`${BASE}/${id}`, { method: "DELETE" });
  },

  toggleArchive: async (id: string, archived: boolean): Promise<void> => {
    return request<void>(`${BASE}/${id}/archive`, {
      method: "PATCH",
      body: JSON.stringify({ archived }),
    });
  },

  reorderHabits: async (orders: { id: string; sortOrder: number }[]): Promise<void> => {
    return request<void>(`${BASE}/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ orders }),
    });
  },

  addLog: async (
    habitId: string,
    data: { date: string; value: number; meta?: string },
  ): Promise<HabitLogEntry> => {
    return request<HabitLogEntry>(`${BASE}/${habitId}/log`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  removeLog: async (logId: string): Promise<void> => {
    return request<void>(`${BASE}/log/${logId}`, { method: "DELETE" });
  },

  getLogs: async (habitId: string, date: string): Promise<HabitLogEntry[]> => {
    return request<HabitLogEntry[]>(`${BASE}/${habitId}/logs?date=${date}`);
  },

  getTodayProgress: async (): Promise<HabitDailyProgress[]> => {
    return request<HabitDailyProgress[]>(`${BASE}/today`);
  },

  getAnalytics: async (id: string, period: "week" | "month"): Promise<HabitAnalyticsData> => {
    return request<HabitAnalyticsData>(`${BASE}/${id}/analytics?period=${period}`);
  },

  getWeeklySummary: async (): Promise<WeeklySummary> => {
    return request<WeeklySummary>(`${BASE}/weekly-review`);
  },

  exportData: async (): Promise<{ habits: HabitDefinition[] }> => {
    return request<{ habits: HabitDefinition[] }>(`${BASE}/export`);
  },

  importData: async (data: unknown): Promise<void> => {
    return request<void>(`${BASE}/import`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// Re-export individual functions for backward compat if needed
export const fetchTodayHabits = habitApi.getTodayProgress;
