import { beforeEach, describe, expect, it } from "vitest";

import { HabitLogService } from "../application/habit-log-service.js";
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

describe("HabitLogService", () => {
  let service: HabitLogService;
  let habitRepo: ReturnType<typeof createMockHabitRepo>;
  let logRepo: ReturnType<typeof createMockHabitLogRepo>;

  beforeEach(() => {
    habitRepo = createMockHabitRepo();
    logRepo = createMockHabitLogRepo();
    service = new HabitLogService(habitRepo, logRepo);
  });

  it("logs a habit", () => {
    const habit = habitRepo.create("h1", { name: "Exercise" });
    const log = service.logHabit({ habitId: habit.id, date: "2026-07-22" });
    expect(log.habitId).toBe(habit.id);
    expect(log.date).toBe("2026-07-22");
  });

  it("returns existing log if already logged today", () => {
    const habit = habitRepo.create("h1", { name: "Exercise" });
    const log1 = service.logHabit({ habitId: habit.id, date: "2026-07-22" });
    const log2 = service.logHabit({ habitId: habit.id, date: "2026-07-22" });
    expect(log1.id).toBe(log2.id);
  });

  it("unlogs a habit", () => {
    const habit = habitRepo.create("h1", { name: "Exercise" });
    service.logHabit({ habitId: habit.id, date: "2026-07-22" });
    const deleted = service.unlogHabit(habit.id, "2026-07-22");
    expect(deleted).toBe(true);
  });

  it("gets today's due habits", () => {
    habitRepo.create("h1", { name: "Exercise", frequency: "daily" });
    const today = new Date().toISOString().split("T")[0];
    const dueHabits = service.getTodayDueHabits(today);
    expect(dueHabits).toHaveLength(1);
  });

  it("batch logs habits", () => {
    habitRepo.create("h1", { name: "Exercise" });
    habitRepo.create("h2", { name: "Reading" });
    const logs = service.batchLogHabits(["h1", "h2"], "2026-07-22");
    expect(logs).toHaveLength(2);
  });
});
