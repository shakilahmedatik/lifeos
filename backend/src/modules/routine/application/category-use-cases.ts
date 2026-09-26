import { randomUUID } from "node:crypto";
import type {
  NewRoutineCategoryInput,
  RoutineCategory,
  UpdateRoutineCategoryInput,
} from "../domain/types.js";
import type { RoutineCategoryRepository } from "../ports/routine-category-repository.js";

export async function getRoutineCategories(
  repo: RoutineCategoryRepository,
  userId: string,
): Promise<RoutineCategory[]> {
  return await repo.getAll(userId);
}

export async function getRoutineCategoryById(
  repo: RoutineCategoryRepository,
  id: string,
  userId: string,
): Promise<RoutineCategory | undefined> {
  return await repo.getById(id, userId);
}

export async function createRoutineCategory(
  repo: RoutineCategoryRepository,
  input: NewRoutineCategoryInput,
  userId: string,
): Promise<RoutineCategory> {
  if (!input.name?.trim()) {
    throw new Error("Category name is required");
  }

  const id = `rcat_${randomUUID()}`;
  return await repo.create(
    id,
    {
      name: input.name.trim(),
      color: input.color?.trim() || "#3b82f6",
      icon: input.icon?.trim() || undefined,
      sortOrder: input.sortOrder,
    },
    userId,
  );
}

export async function updateRoutineCategory(
  repo: RoutineCategoryRepository,
  id: string,
  patch: UpdateRoutineCategoryInput,
  userId: string,
): Promise<RoutineCategory> {
  const existing = await repo.getById(id, userId);
  if (!existing) {
    throw new Error(`Routine category ${id} not found`);
  }

  if (patch.name !== undefined && !patch.name.trim()) {
    throw new Error("Category name cannot be empty");
  }

  const updated = await repo.update(
    id,
    {
      name: patch.name ? patch.name.trim() : undefined,
      color: patch.color ? patch.color.trim() : undefined,
      icon: patch.icon !== undefined ? patch.icon.trim() : undefined,
      sortOrder: patch.sortOrder,
    },
    userId,
  );

  if (!updated) {
    throw new Error(`Failed to update routine category ${id}`);
  }

  return updated;
}

export async function deleteRoutineCategory(
  repo: RoutineCategoryRepository,
  id: string,
  userId: string,
  fallbackCategoryId = "general",
): Promise<{ reassignedCount: number }> {
  const existing = await repo.getById(id, userId);
  if (!existing) {
    throw new Error(`Routine category ${id} not found`);
  }

  // Reassign any existing tasks with this category to fallback category (default: 'general')
  const reassignedCount = await repo.reassignTasksCategory(id, fallbackCategoryId, userId);

  const deleted = await repo.delete(id, userId);
  if (!deleted) {
    throw new Error(`Failed to delete routine category ${id}`);
  }

  return { reassignedCount };
}
