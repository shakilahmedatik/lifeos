import type { Exercise, NewExerciseInput } from "../domain/types.js";

export interface ExerciseRepository {
  getById(id: string, userId: string): Promise<Exercise | undefined>;
  getAll(userId: string): Promise<Exercise[]>;
  getByMuscleGroup(muscleGroup: string, userId: string): Promise<Exercise[]>;
  create(id: string, input: NewExerciseInput, userId: string): Promise<Exercise>;
  update(
    id: string,
    patch: Partial<NewExerciseInput>,
    userId: string,
  ): Promise<Exercise | undefined>;
  delete(id: string, userId: string): Promise<boolean>;
  getByName(name: string, userId: string): Promise<Exercise | undefined>;
}
