import type { Exercise, NewExerciseInput } from "../domain/types.js";

export interface ExerciseRepository {
  getById(id: string, userId: string): Exercise | undefined;
  getAll(userId: string): Exercise[];
  getByMuscleGroup(muscleGroup: string, userId: string): Exercise[];
  create(id: string, input: NewExerciseInput, userId: string): Exercise;
  update(id: string, patch: Partial<NewExerciseInput>, userId: string): Exercise | undefined;
  delete(id: string, userId: string): boolean;
  getByName(name: string, userId: string): Exercise | undefined;
}
