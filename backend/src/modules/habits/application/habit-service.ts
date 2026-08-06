import { randomUUID } from "node:crypto";

import type {
  HabitDefinition,
  NewHabitDefinitionInput,
  UpdateHabitDefinitionInput,
} from "../domain/types.js";
import type { HabitRepository } from "../ports/habit-repository.js";

export class HabitService {
  constructor(private readonly habitRepo: HabitRepository) {}

  async createHabit(input: NewHabitDefinitionInput, userId = "default"): Promise<HabitDefinition> {
    const existing = await this.habitRepo.getByName(input.name.trim(), userId);
    if (existing) {
      throw new Error("A habit with this name already exists");
    }

    const all = await this.habitRepo.getAll(true, userId);
    const maxSortOrder = all.reduce((max, h) => Math.max(max, h.sortOrder), -1);

    const id = randomUUID();
    return await this.habitRepo.create(
      id,
      { ...input, name: input.name.trim() },
      maxSortOrder + 1,
      userId,
    );
  }

  async listHabits(includeArchived = false, userId = "default"): Promise<HabitDefinition[]> {
    return await this.habitRepo.getAll(includeArchived, userId);
  }

  async getHabit(id: string, userId = "default"): Promise<HabitDefinition | undefined> {
    return await this.habitRepo.getById(id, userId);
  }

  async updateHabit(
    id: string,
    patch: UpdateHabitDefinitionInput,
    userId = "default",
  ): Promise<HabitDefinition | undefined> {
    if (patch.name !== undefined) {
      const trimmed = patch.name.trim();
      const existing = await this.habitRepo.getByName(trimmed, userId);
      if (existing && existing.id !== id) {
        throw new Error("A habit with this name already exists");
      }
      patch = { ...patch, name: trimmed };
    }
    return await this.habitRepo.update(id, patch, userId);
  }

  async archiveHabit(id: string, archived: boolean, userId = "default"): Promise<void> {
    await this.habitRepo.archive(id, archived, userId);
  }

  async reorderHabits(
    updates: { id: string; sortOrder: number }[],
    userId = "default",
  ): Promise<void> {
    await this.habitRepo.updateSortOrders(updates, userId);
  }

  async deleteHabit(id: string, userId = "default"): Promise<boolean> {
    return await this.habitRepo.delete(id, userId);
  }
}
