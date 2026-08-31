import type {
  Exercise,
  ExerciseLog,
  ExerciseProgressPoint,
  NewExerciseInput,
  NewExerciseLogInput,
  NewWorkoutExerciseInput,
  NewWorkoutInput,
  Workout,
  WorkoutExercise,
  WorkoutSession,
  WorkoutSessionWithLogs,
  WorkoutStats,
  WorkoutWithExercises,
} from "@lifeos/contracts";
import { getDataSource } from "../../lib/dataSource.js";

export type { ExerciseProgressPoint };

// Workout API
export async function fetchWorkouts(): Promise<Workout[]> {
  return (await getDataSource()).getWorkouts();
}

export async function fetchWorkout(id: string): Promise<WorkoutWithExercises> {
  return (await getDataSource()).getWorkout(id);
}

export async function createWorkout(input: NewWorkoutInput): Promise<Workout> {
  return (await getDataSource()).createWorkout(input);
}

export async function updateWorkout(id: string, patch: Partial<NewWorkoutInput>): Promise<Workout> {
  return (await getDataSource()).updateWorkout(id, patch);
}

export async function deleteWorkout(id: string): Promise<void> {
  return (await getDataSource()).deleteWorkout(id);
}

// Workout Exercise API
export async function addExerciseToWorkout(
  workoutId: string,
  exerciseId: string,
  input: NewWorkoutExerciseInput,
): Promise<WorkoutExercise> {
  return (await getDataSource()).addExerciseToWorkout(workoutId, exerciseId, input);
}

export async function updateWorkoutExercise(
  workoutId: string,
  exerciseId: string,
  patch: Partial<NewWorkoutExerciseInput>,
): Promise<WorkoutExercise> {
  return (await getDataSource()).updateWorkoutExercise(workoutId, exerciseId, patch);
}

export async function removeExerciseFromWorkout(
  workoutId: string,
  exerciseId: string,
): Promise<void> {
  return (await getDataSource()).removeExerciseFromWorkout(workoutId, exerciseId);
}

export async function reorderWorkoutExercises(
  workoutId: string,
  exerciseIds: string[],
): Promise<void> {
  return (await getDataSource()).reorderWorkoutExercises(workoutId, exerciseIds);
}

// Exercise Library API
export async function fetchExercises(): Promise<Exercise[]> {
  return (await getDataSource()).getExercises();
}

export async function fetchExercise(id: string): Promise<Exercise> {
  return (await getDataSource()).getExercise(id);
}

export async function createExercise(input: NewExerciseInput): Promise<Exercise> {
  return (await getDataSource()).createExercise(input);
}

export async function updateExercise(
  id: string,
  patch: Partial<NewExerciseInput>,
): Promise<Exercise> {
  return (await getDataSource()).updateExercise(id, patch);
}

export async function deleteExercise(id: string): Promise<void> {
  return (await getDataSource()).deleteExercise(id);
}

// Session API
export async function fetchSessions(): Promise<WorkoutSession[]> {
  return (await getDataSource()).getWorkoutSessions();
}

export async function fetchSession(id: string): Promise<WorkoutSessionWithLogs> {
  return (await getDataSource()).getWorkoutSession(id);
}

export async function startSession(workoutId: string): Promise<WorkoutSession> {
  return (await getDataSource()).startWorkoutSession(workoutId);
}

export async function completeSession(
  id: string,
  durationSeconds: number,
  notes?: string,
): Promise<WorkoutSession> {
  return (await getDataSource()).completeWorkoutSession(id, durationSeconds, notes);
}

export async function deleteSession(id: string): Promise<void> {
  return (await getDataSource()).deleteWorkoutSession(id);
}

// Session Logs API
export async function addExerciseLog(
  sessionId: string,
  input: NewExerciseLogInput,
): Promise<ExerciseLog> {
  return (await getDataSource()).addExerciseLog(sessionId, input);
}

export async function fetchSessionLogs(sessionId: string): Promise<ExerciseLog[]> {
  return (await getDataSource()).getExerciseLogs(sessionId);
}

// History API
export async function fetchWorkoutHistory(): Promise<WorkoutSession[]> {
  return (await getDataSource()).getWorkoutHistory();
}

export async function fetchWorkoutStats(): Promise<WorkoutStats> {
  return (await getDataSource()).getWorkoutStats();
}

export async function fetchRecentSessions(limit = 10): Promise<WorkoutSession[]> {
  return (await getDataSource()).getRecentWorkoutSessions(limit);
}

export async function fetchExerciseProgress(exerciseId: string): Promise<ExerciseProgressPoint[]> {
  return (await getDataSource()).getExerciseProgress(exerciseId);
}

export async function cancelSession(sessionId: string): Promise<void> {
  return (await getDataSource()).cancelWorkoutSession(sessionId);
}
