import { beforeEach, describe, expect, it } from "vitest";

import { HabitStatsService } from "../application/habit-stats-service.js";
import type { Habit, HabitLog, NewHabitInput } from "../domain/types.js";
import type { HabitLogRepository } from "../ports/habit-log-repository.js";
import type { HabitRepository } from "../ports/habit-repository.js";

function createMockHabitRepo(): HabitRepository & { habits: Map<string, Habit> } {
  const habits = new Map<string, Habit>();
  return {
    habits,
    getById(id) {
      return habits.get(id);
    },
    getAll() {
      return Array.from(habits.values());
    },
    getByFrequency(frequency) {
      return Array.from(habits.values()).filter((h) => h.frequency === frequency);
    },
    create(id: string, input: NewHabitInput) {
      const now = new Date().toISOString();
      const habit: Habit = {
        id,
        name: input.name,
        frequency: input.frequency ?? "daily",
        targetCount: input.targetCount ?? 1,
        category: input.category ?? "general",
        createdAt: now,
        updatedAt: now,
      };
      habits.set(id, habit);
      return habit;
    },
    update(id, patch) {
      const existing = habits.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
      habits.set(id, updated);
      return updated;
    },
    delete(id) {
      return habits.delete(id);
    },
    getByName(name) {
      return Array.from(habits.values()).find((h) => h.name === name);
    },
  };
}

function createMockHabitLogRepo(): HabitLogRepository & { logs: Map<string, HabitLog> } {
  const logs = new Map<string, HabitLog>();
  return {
    logs,
    getById(id) {
      return logs.get(id);
    },
    getByHabitAndDate(habitId, date) {
      return Array.from(logs.values()).find((l) => l.habitId === habitId && l.date === date);
    },
    getByDateRange(startDate, endDate) {
      return Array.from(logs.values()).filter((l) => l.date >= startDate && l.date <= endDate);
    },
    getByHabitId(habitId) {
      return Array.from(logs.values()).filter((l) => l.habitId === habitId);
    },
    create(id: string, input) {
      const now = new Date().toISOString();
      const log: HabitLog = {
        id,
        habitId: input.habitId,
        date: input.date,
        completedAt: now,
      };
      logs.set(id, log);
      return log;
    },
    delete(id) {
      return logs.delete(id);
    },
    deleteByHabitId(habitId) {
      for (const [id, log] of logs) {
        if (log.habitId === habitId) logs.delete(id);
      }
    },
  };
}

describe("HabitStatsService", () => {
  let service: HabitStatsService;
  let habitRepo: ReturnType<typeof createMockHabitRepo>;
  let logRepo: ReturnType<typeof createMockHabitLogRepo>;

  beforeEach(() => {
    habitRepo = createMockHabitRepo();
    logRepo = createMockHabitLogRepo();
    service = new HabitStatsService(habitRepo, logRepo);
  });

  it("returns undefined for non-existent habit", () => {
    const stats = service.getHabitStats("nonexistent", "2026-07-01", "2026-07-31");
    expect(stats).toBeUndefined();
  });

  it("calculates habit stats", () => {
    const habit = habitRepo.create("h1", { name: "Exercise" });
    logRepo.create("l1", { habitId: habit.id, date: "2026-07-20" });
    logRepo.create("l2", { habitId: habit.id, date: "2026-07-21" });

    const stats = service.getHabitStats(habit.id, "2026-07-01", "2026-07-31");
    expect(stats).toBeDefined();
    expect(stats?.habitId).toBe(habit.id);
    expect(stats?.totalCompletions).toBe(2);
  });
});
