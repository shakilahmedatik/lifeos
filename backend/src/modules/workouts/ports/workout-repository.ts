import type {
  NewWorkoutExerciseInput,
  NewWorkoutInput,
  Workout,
  WorkoutExercise,
  WorkoutWithExercises,
} from "../domain/types.js";

export interface WorkoutRepository {
  getById(id: string): Promise<Workout | undefined>;
  getAll(): Promise<Workout[]>;
  getByScheduledDay(day: string): Promise<Workout[]>;
  create(id: string, input: NewWorkoutInput): Promise<Workout>;
  update(id: string, patch: Partial<NewWorkoutInput>): Promise<Workout | undefined>;
  delete(id: string): Promise<boolean>;
  getWithExercises(id: string): Promise<WorkoutWithExercises | undefined>;
  addExercise(
    workoutId: string,
    exerciseId: string,
    input: NewWorkoutExerciseInput,
  ): Promise<WorkoutExercise>;
  updateExercise(
    id: string,
    patch: Partial<NewWorkoutExerciseInput>,
  ): Promise<WorkoutExercise | undefined>;
  removeExercise(id: string): Promise<boolean>;
  getExerciseById(id: string): Promise<WorkoutExercise | undefined>;
  getExercisesByWorkoutId(workoutId: string): Promise<WorkoutExercise[]>;
  reorderExercises(workoutId: string, exerciseIds: string[]): Promise<void>;
}
