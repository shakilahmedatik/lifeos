import { randomUUID } from "node:crypto";

import type { Exercise, NewExerciseInput } from "../domain/types.js";
import type { ExerciseRepository } from "../ports/exercise-repository.js";

export class ExerciseService {
  constructor(private readonly exerciseRepo: ExerciseRepository) {}

  async createExercise(input: NewExerciseInput, userId = "default"): Promise<Exercise> {
    const existing = await this.exerciseRepo.getByName(input.name, userId);
    if (existing) {
      throw new Error("Exercise with this name already exists");
    }

    const id = randomUUID();
    return await this.exerciseRepo.create(id, input, userId);
  }

  async listExercises(userId = "default"): Promise<Exercise[]> {
    return await this.exerciseRepo.getAll(userId);
  }

  async getExercise(id: string, userId = "default"): Promise<Exercise | undefined> {
    return await this.exerciseRepo.getById(id, userId);
  }

  async updateExercise(
    id: string,
    patch: Partial<NewExerciseInput>,
    userId = "default",
  ): Promise<Exercise | undefined> {
    if (patch.name) {
      const existing = await this.exerciseRepo.getByName(patch.name, userId);
      if (existing && existing.id !== id) {
        throw new Error("Exercise with this name already exists");
      }
    }

    return await this.exerciseRepo.update(id, patch, userId);
  }

  async deleteExercise(id: string, userId = "default"): Promise<boolean> {
    return await this.exerciseRepo.delete(id, userId);
  }

  async getExercisesByMuscleGroup(muscleGroup: string, userId = "default"): Promise<Exercise[]> {
    return await this.exerciseRepo.getByMuscleGroup(muscleGroup, userId);
  }
}
