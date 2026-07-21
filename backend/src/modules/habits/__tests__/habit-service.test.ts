import { beforeEach, describe, expect, it } from "vitest";

import { HabitService } from "../application/habit-service.js";
import type { Habit, NewHabitInput } from "../domain/types.js";
import type { HabitRepository } from "../ports/habit-repository.js";

function createMockHabitRepo(): HabitRepository & { habits: Map<string, Habit> } {
  const habits = new Map<string, Habit>();
  return {
    habits,
    getById(id: string) {
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
    update(id: string, patch: Partial<NewHabitInput>) {
      const existing = habits.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
      habits.set(id, updated);
      return updated;
    },
    delete(id: string) {
      return habits.delete(id);
    },
    getByName(name: string) {
      return Array.from(habits.values()).find((h) => h.name === name);
    },
  };
}

describe("HabitService", () => {
  let service: HabitService;
  let repo: ReturnType<typeof createMockHabitRepo>;

  beforeEach(() => {
    repo = createMockHabitRepo();
    service = new HabitService(repo);
  });

  it("creates a habit", () => {
    const habit = service.createHabit({ name: "Exercise" });
    expect(habit.name).toBe("Exercise");
    expect(habit.frequency).toBe("daily");
    expect(repo.habits.size).toBe(1);
  });

  it("rejects duplicate names", () => {
    service.createHabit({ name: "Exercise" });
    expect(() => service.createHabit({ name: "Exercise" })).toThrow("already exists");
  });

  it("lists all habits", () => {
    service.createHabit({ name: "Habit 1" });
    service.createHabit({ name: "Habit 2" });
    expect(service.listHabits()).toHaveLength(2);
  });

  it("updates a habit", () => {
    const habit = service.createHabit({ name: "Exercise" });
    const updated = service.updateHabit(habit.id, { name: "Workout" });
    expect(updated?.name).toBe("Workout");
  });

  it("deletes a habit", () => {
    const habit = service.createHabit({ name: "Exercise" });
    expect(service.deleteHabit(habit.id)).toBe(true);
    expect(repo.habits.size).toBe(0);
  });
});
