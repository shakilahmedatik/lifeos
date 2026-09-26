import type {
  NewWorkoutExerciseInput,
  NewWorkoutInput,
  Workout,
  WorkoutExercise,
  WorkoutWithExercises,
} from "../domain/types.js";

export interface WorkoutRepository {
  getById(id: string, userId: string): Promise<Workout | undefined>;
  getAll(userId: string): Promise<Workout[]>;
  getByScheduledDay(day: string, userId: string): Promise<Workout[]>;
  create(id: string, input: NewWorkoutInput, userId: string): Promise<Workout>;
  update(id: string, patch: Partial<NewWorkoutInput>, userId: string): Promise<Workout | undefined>;
  delete(id: string, userId: string): Promise<boolean>;
  getWithExercises(id: string, userId: string): Promise<WorkoutWithExercises | undefined>;
  addExercise(
    workoutId: string,
    exerciseId: string,
    input: NewWorkoutExerciseInput,
    userId: string,
  ): Promise<WorkoutExercise>;
  updateExercise(
    id: string,
    patch: Partial<NewWorkoutExerciseInput>,
    userId: string,
  ): Promise<WorkoutExercise | undefined>;
  removeExercise(id: string, userId: string): Promise<boolean>;
  getExerciseById(id: string, userId: string): Promise<WorkoutExercise | undefined>;
  getExercisesByWorkoutId(workoutId: string, userId: string): Promise<WorkoutExercise[]>;
  reorderExercises(workoutId: string, exerciseIds: string[], userId: string): Promise<void>;
}
