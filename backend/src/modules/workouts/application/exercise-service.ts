import { randomUUID } from "node:crypto";

import type { Exercise, NewExerciseInput } from "../domain/types.js";
import type { ExerciseRepository } from "../ports/exercise-repository.js";

export class ExerciseService {
  constructor(private readonly exerciseRepo: ExerciseRepository) {}

  createExercise(input: NewExerciseInput): Exercise {
    const existing = this.exerciseRepo.getByName(input.name);
    if (existing) {
      throw new Error("Exercise with this name already exists");
    }

    const id = randomUUID();
    return this.exerciseRepo.create(id, input);
  }

  listExercises(): Exercise[] {
    return this.exerciseRepo.getAll();
  }

  getExercise(id: string): Exercise | undefined {
    return this.exerciseRepo.getById(id);
  }

  updateExercise(id: string, patch: Partial<NewExerciseInput>): Exercise | undefined {
    if (patch.name) {
      const existing = this.exerciseRepo.getByName(patch.name);
      if (existing && existing.id !== id) {
        throw new Error("Exercise with this name already exists");
      }
    }

    return this.exerciseRepo.update(id, patch);
  }

  deleteExercise(id: string): boolean {
    return this.exerciseRepo.delete(id);
  }

  getExercisesByMuscleGroup(muscleGroup: string): Exercise[] {
    return this.exerciseRepo.getByMuscleGroup(muscleGroup);
  }
}
