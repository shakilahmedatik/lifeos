import type { Exercise, NewExerciseInput } from "../domain/types.js";

export interface ExerciseRepository {
  getById(id: string): Exercise | undefined;
  getAll(): Exercise[];
  getByMuscleGroup(muscleGroup: string): Exercise[];
  create(id: string, input: NewExerciseInput): Exercise;
  update(id: string, patch: Partial<NewExerciseInput>): Exercise | undefined;
  delete(id: string): boolean;
  getByName(name: string): Exercise | undefined;
}
