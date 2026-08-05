import type {
  HabitDefinition,
  NewHabitDefinitionInput,
  UpdateHabitDefinitionInput,
} from "../domain/types.js";

export interface HabitRepository {
  getById(id: string): HabitDefinition | undefined;
  getByName(name: string): HabitDefinition | undefined;
  getAll(includeArchived?: boolean): HabitDefinition[];
  create(id: string, input: NewHabitDefinitionInput, sortOrder: number): HabitDefinition;
  update(id: string, patch: UpdateHabitDefinitionInput): HabitDefinition | undefined;
  delete(id: string): boolean;
  archive(id: string, archived: boolean): void;
  updateSortOrders(updates: { id: string; sortOrder: number }[]): void;
}
