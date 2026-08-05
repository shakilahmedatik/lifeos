import type {
  HabitDefinition,
  NewHabitDefinitionInput,
  UpdateHabitDefinitionInput,
} from "../domain/types.js";

export interface HabitRepository {
  getById(id: string, userId: string): HabitDefinition | undefined;
  getByName(name: string, userId: string): HabitDefinition | undefined;
  getAll(includeArchived: boolean, userId: string): HabitDefinition[];
  create(
    id: string,
    input: NewHabitDefinitionInput,
    sortOrder: number,
    userId: string,
  ): HabitDefinition;
  update(
    id: string,
    patch: UpdateHabitDefinitionInput,
    userId: string,
  ): HabitDefinition | undefined;
  delete(id: string, userId: string): boolean;
  archive(id: string, archived: boolean, userId: string): void;
  updateSortOrders(updates: { id: string; sortOrder: number }[], userId: string): void;
}
