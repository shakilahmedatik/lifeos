import { randomUUID } from "node:crypto";

import type {
  HabitDefinition,
  NewHabitDefinitionInput,
  UpdateHabitDefinitionInput,
} from "../domain/types.js";
import type { HabitRepository } from "../ports/habit-repository.js";

export class HabitService {
  constructor(private readonly habitRepo: HabitRepository) {}

  createHabit(input: NewHabitDefinitionInput, userId = "default"): HabitDefinition {
    const existing = this.habitRepo.getByName(input.name.trim(), userId);
    if (existing) {
      throw new Error("A habit with this name already exists");
    }

    const all = this.habitRepo.getAll(true, userId);
    const maxSortOrder = all.reduce((max, h) => Math.max(max, h.sortOrder), -1);

    const id = randomUUID();
    return this.habitRepo.create(
      id,
      { ...input, name: input.name.trim() },
      maxSortOrder + 1,
      userId,
    );
  }

  listHabits(includeArchived = false, userId = "default"): HabitDefinition[] {
    return this.habitRepo.getAll(includeArchived, userId);
  }

  getHabit(id: string, userId = "default"): HabitDefinition | undefined {
    return this.habitRepo.getById(id, userId);
  }

  updateHabit(
    id: string,
    patch: UpdateHabitDefinitionInput,
    userId = "default",
  ): HabitDefinition | undefined {
    if (patch.name !== undefined) {
      const trimmed = patch.name.trim();
      const existing = this.habitRepo.getByName(trimmed, userId);
      if (existing && existing.id !== id) {
        throw new Error("A habit with this name already exists");
      }
      patch = { ...patch, name: trimmed };
    }
    return this.habitRepo.update(id, patch, userId);
  }

  archiveHabit(id: string, archived: boolean, userId = "default"): void {
    this.habitRepo.archive(id, archived, userId);
  }

  reorderHabits(updates: { id: string; sortOrder: number }[], userId = "default"): void {
    this.habitRepo.updateSortOrders(updates, userId);
  }

  deleteHabit(id: string, userId = "default"): boolean {
    return this.habitRepo.delete(id, userId);
  }
}
