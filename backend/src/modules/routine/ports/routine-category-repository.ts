import type {
  NewRoutineCategoryInput,
  RoutineCategory,
  UpdateRoutineCategoryInput,
} from "../domain/types.js";

export interface RoutineCategoryRepository {
  getById(id: string, userId: string): Promise<RoutineCategory | undefined>;
  getAll(userId: string): Promise<RoutineCategory[]>;
  create(id: string, input: NewRoutineCategoryInput, userId: string): Promise<RoutineCategory>;
  update(
    id: string,
    patch: UpdateRoutineCategoryInput,
    userId: string,
  ): Promise<RoutineCategory | undefined>;
  delete(id: string, userId: string): Promise<boolean>;
  countTasksByCategoryId(categoryId: string, userId: string): Promise<number>;
  reassignTasksCategory(
    fromCategoryId: string,
    toCategoryId: string,
    userId: string,
  ): Promise<number>;
}
