import type { Habit, NewHabitInput } from "../domain/types.js";

export interface HabitRepository {
  getById(id: string): Habit | undefined;
  getAll(): Habit[];
  getByFrequency(frequency: Habit["frequency"]): Habit[];
  create(id: string, input: NewHabitInput): Habit;
  update(id: string, patch: Partial<NewHabitInput>): Habit | undefined;
  delete(id: string): boolean;
  getByName(name: string): Habit | undefined;
}
