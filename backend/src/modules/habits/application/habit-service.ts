import { randomUUID } from "node:crypto";

import type {
  HabitDefinition,
  NewHabitDefinitionInput,
  UpdateHabitDefinitionInput,
} from "../domain/types.js";
import type { HabitRepository } from "../ports/habit-repository.js";

export class HabitService {
  constructor(private readonly habitRepo: HabitRepository) {}

  createHabit(input: NewHabitDefinitionInput): HabitDefinition {
    const existing = this.habitRepo.getByName(input.name.trim());
    if (existing) {
      throw new Error("A habit with this name already exists");
    }

    const all = this.habitRepo.getAll(true);
    const maxSortOrder = all.reduce((max, h) => Math.max(max, h.sortOrder), -1);

    const id = randomUUID();
    return this.habitRepo.create(id, { ...input, name: input.name.trim() }, maxSortOrder + 1);
  }

  listHabits(includeArchived = false): HabitDefinition[] {
    return this.habitRepo.getAll(includeArchived);
  }

  getHabit(id: string): HabitDefinition | undefined {
    return this.habitRepo.getById(id);
  }

  updateHabit(id: string, patch: UpdateHabitDefinitionInput): HabitDefinition | undefined {
    if (patch.name !== undefined) {
      const trimmed = patch.name.trim();
      const existing = this.habitRepo.getByName(trimmed);
      if (existing && existing.id !== id) {
        throw new Error("A habit with this name already exists");
      }
      patch = { ...patch, name: trimmed };
    }
    return this.habitRepo.update(id, patch);
  }

  archiveHabit(id: string, archived: boolean): void {
    this.habitRepo.archive(id, archived);
  }

  reorderHabits(updates: { id: string; sortOrder: number }[]): void {
    this.habitRepo.updateSortOrders(updates);
  }

  deleteHabit(id: string): boolean {
    return this.habitRepo.delete(id);
  }
}
