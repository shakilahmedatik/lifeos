import type {
  NewWorkoutExerciseInput,
  NewWorkoutInput,
  Workout,
  WorkoutExercise,
  WorkoutWithExercises,
} from "../domain/types.js";

export interface WorkoutRepository {
  getById(id: string): Workout | undefined;
  getAll(): Workout[];
  getByScheduledDay(day: string): Workout[];
  create(id: string, input: NewWorkoutInput): Workout;
  update(id: string, patch: Partial<NewWorkoutInput>): Workout | undefined;
  delete(id: string): boolean;
  getWithExercises(id: string): WorkoutWithExercises | undefined;
  addExercise(
    workoutId: string,
    exerciseId: string,
    input: NewWorkoutExerciseInput,
  ): WorkoutExercise;
  updateExercise(id: string, patch: Partial<NewWorkoutExerciseInput>): WorkoutExercise | undefined;
  removeExercise(id: string): boolean;
  getExerciseById(id: string): WorkoutExercise | undefined;
  getExercisesByWorkoutId(workoutId: string): WorkoutExercise[];
}
