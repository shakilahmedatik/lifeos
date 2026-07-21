import { randomUUID } from "node:crypto";

import type { Habit, NewHabitInput } from "../domain/types.js";
import type { HabitRepository } from "../ports/habit-repository.js";

export class HabitService {
  constructor(private readonly habitRepo: HabitRepository) {}

  createHabit(input: NewHabitInput): Habit {
    const existing = this.habitRepo.getByName(input.name);
    if (existing) {
      throw new Error("Habit with this name already exists");
    }

    const id = randomUUID();
    return this.habitRepo.create(id, input);
  }

  listHabits(): Habit[] {
    return this.habitRepo.getAll();
  }

  getHabit(id: string): Habit | undefined {
    return this.habitRepo.getById(id);
  }

  updateHabit(id: string, patch: Partial<NewHabitInput>): Habit | undefined {
    if (patch.name) {
      const existing = this.habitRepo.getByName(patch.name);
      if (existing && existing.id !== id) {
        throw new Error("Habit with this name already exists");
      }
    }

    return this.habitRepo.update(id, patch);
  }

  deleteHabit(id: string): boolean {
    return this.habitRepo.delete(id);
  }
}
