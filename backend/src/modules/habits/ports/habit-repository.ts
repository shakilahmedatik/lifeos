import type {
  HabitDefinition,
  NewHabitDefinitionInput,
  UpdateHabitDefinitionInput,
} from "../domain/types.js";

export interface HabitRepository {
  getById(id: string, userId: string): Promise<HabitDefinition | undefined>;
  getByName(name: string, userId: string): Promise<HabitDefinition | undefined>;
  getAll(includeArchived: boolean, userId: string): Promise<HabitDefinition[]>;
  create(
    id: string,
    input: NewHabitDefinitionInput,
    sortOrder: number,
    userId: string,
  ): Promise<HabitDefinition>;
  update(
    id: string,
    patch: UpdateHabitDefinitionInput,
    userId: string,
  ): Promise<HabitDefinition | undefined>;
  delete(id: string, userId: string): Promise<boolean>;
  archive(id: string, archived: boolean, userId: string): Promise<void>;
  updateSortOrders(updates: { id: string; sortOrder: number }[], userId: string): Promise<void>;
}
