import type {
  HabitAnalyticsData,
  HabitDailyProgress,
  HabitDefinition,
  HabitLogEntry,
  NewHabitDefinitionInput,
  WeeklySummary,
} from "@lifeos/contracts";

import { getDataSource } from "../../lib/dataSource.js";

export const habitApi = {
  getHabits: async (activeOnly?: boolean): Promise<HabitDefinition[]> => {
    const ds = await getDataSource();
    const habits = await ds.getHabits();
    return activeOnly ? habits.filter((h) => !h.archived) : habits;
  },

  getHabit: async (id: string): Promise<HabitDefinition> => {
    const ds = await getDataSource();
    return ds.getHabit(id);
  },

  createHabit: async (data: NewHabitDefinitionInput): Promise<HabitDefinition> => {
    const ds = await getDataSource();
    return ds.createHabit(data);
  },

  updateHabit: async (id: string, data: Partial<HabitDefinition>): Promise<HabitDefinition> => {
    const ds = await getDataSource();
    return ds.updateHabit(id, data);
  },

  deleteHabit: async (id: string): Promise<void> => {
    const ds = await getDataSource();
    return ds.deleteHabit(id);
  },

  toggleArchive: async (id: string, archived: boolean): Promise<void> => {
    const ds = await getDataSource();
    return ds.archiveHabit(id, archived);
  },

  reorderHabits: async (orders: { id: string; sortOrder: number }[]): Promise<void> => {
    const ds = await getDataSource();
    return ds.reorderHabits(orders);
  },

  addLog: async (
    habitId: string,
    data: { date: string; value: number; meta?: string },
  ): Promise<HabitLogEntry> => {
    const ds = await getDataSource();
    return ds.logHabit(habitId, data.date, data.value, data.meta);
  },

  removeLog: async (logId: string): Promise<void> => {
    const ds = await getDataSource();
    return ds.unlogHabitByLogId(logId);
  },

  removeLogByDate: async (habitId: string, date: string): Promise<void> => {
    const ds = await getDataSource();
    return ds.unlogHabit(habitId, date);
  },

  getLogs: async (habitId: string, date: string): Promise<HabitLogEntry[]> => {
    const ds = await getDataSource();
    return ds.getHabitLogs(habitId, date);
  },

  getTodayProgress: async (): Promise<HabitDailyProgress[]> => {
    const ds = await getDataSource();
    const todayHabits = await ds.getTodayHabits();
    return todayHabits.map((h) => ({
      habit: h,
      date: new Date().toISOString().split("T")[0],
      currentValue: h.todayValue || 0,
      targetValue: h.todayTarget || 1,
      progress: h.todayProgress || 0,
      logs: h.logs || [],
      currentStreak: h.currentStreak || 0,
      longestStreak: h.longestStreak || 0,
    }));
  },

  getAnalytics: async (
    id: string,
    period: "week" | "month",
  ): Promise<HabitAnalyticsData | undefined> => {
    const ds = await getDataSource();
    return ds.getHabitAnalytics(id, period);
  },

  getWeeklySummary: async (): Promise<WeeklySummary> => {
    const ds = await getDataSource();
    return ds.getWeeklyReview();
  },

  exportData: async (): Promise<{ habits: HabitDefinition[] }> => {
    const ds = await getDataSource();
    return ds.exportHabits();
  },

  importData: async (data: unknown): Promise<void> => {
    const ds = await getDataSource();
    return ds.importHabits(data);
  },
};

// Re-export individual functions for backward compat if needed
export const fetchTodayHabits = habitApi.getTodayProgress;
