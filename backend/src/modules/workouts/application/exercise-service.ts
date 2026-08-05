import { randomUUID } from "node:crypto";

import type { Exercise, NewExerciseInput } from "../domain/types.js";
import type { ExerciseRepository } from "../ports/exercise-repository.js";

export class ExerciseService {
  constructor(private readonly exerciseRepo: ExerciseRepository) {}

  createExercise(input: NewExerciseInput, userId = "default"): Exercise {
    const existing = this.exerciseRepo.getByName(input.name, userId);
    if (existing) {
      throw new Error("Exercise with this name already exists");
    }

    const id = randomUUID();
    return this.exerciseRepo.create(id, input, userId);
  }

  listExercises(userId = "default"): Exercise[] {
    return this.exerciseRepo.getAll(userId);
  }

  getExercise(id: string, userId = "default"): Exercise | undefined {
    return this.exerciseRepo.getById(id, userId);
  }

  updateExercise(
    id: string,
    patch: Partial<NewExerciseInput>,
    userId = "default",
  ): Exercise | undefined {
    if (patch.name) {
      const existing = this.exerciseRepo.getByName(patch.name, userId);
      if (existing && existing.id !== id) {
        throw new Error("Exercise with this name already exists");
      }
    }

    return this.exerciseRepo.update(id, patch, userId);
  }

  deleteExercise(id: string, userId = "default"): boolean {
    return this.exerciseRepo.delete(id, userId);
  }

  getExercisesByMuscleGroup(muscleGroup: string, userId = "default"): Exercise[] {
    return this.exerciseRepo.getByMuscleGroup(muscleGroup, userId);
  }
}
