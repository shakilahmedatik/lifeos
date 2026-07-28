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

  createWorkout(input: NewWorkoutInput): Workout {
    const id = randomUUID();
    return this.workoutRepo.create(id, input);
  }

  listWorkouts(): Workout[] {
    return this.workoutRepo.getAll();
  }

  getWorkout(id: string): Workout | undefined {
    return this.workoutRepo.getById(id);
  }

  getWorkoutWithExercises(id: string): WorkoutWithExercises | undefined {
    return this.workoutRepo.getWithExercises(id);
  }

  updateWorkout(id: string, patch: Partial<NewWorkoutInput>): Workout | undefined {
    return this.workoutRepo.update(id, patch);
  }

  deleteWorkout(id: string): boolean {
    return this.workoutRepo.delete(id);
  }

  addExerciseToWorkout(
    workoutId: string,
    exerciseId: string,
    input: NewWorkoutExerciseInput,
  ): WorkoutExercise {
    return this.workoutRepo.addExercise(workoutId, exerciseId, input);
  }

  updateWorkoutExercise(
    id: string,
    patch: Partial<NewWorkoutExerciseInput>,
  ): WorkoutExercise | undefined {
    return this.workoutRepo.updateExercise(id, patch);
  }

  removeExerciseFromWorkout(id: string): boolean {
    return this.workoutRepo.removeExercise(id);
  }

  getWorkoutsByDay(day: string): Workout[] {
    return this.workoutRepo.getByScheduledDay(day);
  }

  reorderExercises(workoutId: string, exerciseIds: string[]): void {
    this.workoutRepo.reorderExercises(workoutId, exerciseIds);
  }
}
