import { randomUUID } from "node:crypto";

import type {
  NewWorkoutExerciseInput,
  NewWorkoutInput,
  Workout,
  WorkoutExercise,
  WorkoutWithExercises,
} from "../domain/types.js";
import type { WorkoutRepository } from "../ports/workout-repository.js";

export class WorkoutService {
  constructor(private readonly workoutRepo: WorkoutRepository) {}

  async createWorkout(input: NewWorkoutInput, userId = "default"): Promise<Workout> {
    const id = randomUUID();
    return await this.workoutRepo.create(id, input, userId);
  }

  async listWorkouts(userId = "default"): Promise<Workout[]> {
    return await this.workoutRepo.getAll(userId);
  }

  async getWorkout(id: string, userId = "default"): Promise<Workout | undefined> {
    return await this.workoutRepo.getById(id, userId);
  }

  async getWorkoutWithExercises(
    id: string,
    userId = "default",
  ): Promise<WorkoutWithExercises | undefined> {
    return await this.workoutRepo.getWithExercises(id, userId);
  }

  async updateWorkout(
    id: string,
    patch: Partial<NewWorkoutInput>,
    userId = "default",
  ): Promise<Workout | undefined> {
    return await this.workoutRepo.update(id, patch, userId);
  }

  async deleteWorkout(id: string, userId = "default"): Promise<boolean> {
    return await this.workoutRepo.delete(id, userId);
  }

  // Exercise Management
  async addExerciseToWorkout(
    workoutId: string,
    exerciseId: string,
    input: NewWorkoutExerciseInput,
    userId = "default",
  ): Promise<WorkoutExercise> {
    return await this.workoutRepo.addExercise(workoutId, exerciseId, input, userId);
  }

  async updateWorkoutExercise(
    id: string,
    patch: Partial<NewWorkoutExerciseInput>,
    userId = "default",
  ): Promise<WorkoutExercise | undefined> {
    return await this.workoutRepo.updateExercise(id, patch, userId);
  }

  async removeExerciseFromWorkout(id: string, userId = "default"): Promise<boolean> {
    return await this.workoutRepo.removeExercise(id, userId);
  }

  async getWorkoutsByDay(day: string, userId = "default"): Promise<Workout[]> {
    return await this.workoutRepo.getByScheduledDay(day, userId);
  }

  async reorderExercises(
    workoutId: string,
    exerciseIds: string[],
    userId = "default",
  ): Promise<void> {
    await this.workoutRepo.reorderExercises(workoutId, exerciseIds, userId);
  }
}
