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

  async createWorkout(input: NewWorkoutInput): Promise<Workout> {
    const id = randomUUID();
    return await this.workoutRepo.create(id, input);
  }

  async listWorkouts(): Promise<Workout[]> {
    return await this.workoutRepo.getAll();
  }

  async getWorkout(id: string): Promise<Workout | undefined> {
    return await this.workoutRepo.getById(id);
  }

  async getWorkoutWithExercises(id: string): Promise<WorkoutWithExercises | undefined> {
    return await this.workoutRepo.getWithExercises(id);
  }

  async updateWorkout(id: string, patch: Partial<NewWorkoutInput>): Promise<Workout | undefined> {
    return await this.workoutRepo.update(id, patch);
  }

  async deleteWorkout(id: string): Promise<boolean> {
    return await this.workoutRepo.delete(id);
  }

  async addExerciseToWorkout(
    workoutId: string,
    exerciseId: string,
    input: NewWorkoutExerciseInput,
  ): Promise<WorkoutExercise> {
    return await this.workoutRepo.addExercise(workoutId, exerciseId, input);
  }

  async updateWorkoutExercise(
    id: string,
    patch: Partial<NewWorkoutExerciseInput>,
  ): Promise<WorkoutExercise | undefined> {
    return await this.workoutRepo.updateExercise(id, patch);
  }

  async removeExerciseFromWorkout(id: string): Promise<boolean> {
    return await this.workoutRepo.removeExercise(id);
  }

  async getWorkoutsByDay(day: string): Promise<Workout[]> {
    return await this.workoutRepo.getByScheduledDay(day);
  }

  async reorderExercises(workoutId: string, exerciseIds: string[]): Promise<void> {
    await this.workoutRepo.reorderExercises(workoutId, exerciseIds);
  }
}
