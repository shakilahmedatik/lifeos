import type {
  ExerciseLog,
  ExerciseProgressPoint,
  NewExerciseLogInput,
  WorkoutSession,
  WorkoutSessionWithLogs,
} from "../domain/types.js";

export interface WorkoutSessionRepository {
  getById(id: string, userId: string): Promise<WorkoutSession | undefined>;
  getAll(userId: string): Promise<WorkoutSession[]>;
  getByWorkoutId(workoutId: string, userId: string): Promise<WorkoutSession[]>;
  create(id: string, workoutId: string, userId: string): Promise<WorkoutSession>;
  complete(
    id: string,
    durationSeconds: number,
    userId: string,
    notes?: string,
  ): Promise<WorkoutSession | undefined>;
  delete(id: string, userId: string): Promise<boolean>;
  getWithLogs(id: string, userId: string): Promise<WorkoutSessionWithLogs | undefined>;
  addLog(sessionId: string, input: NewExerciseLogInput, userId: string): Promise<ExerciseLog>;
  getLogsBySessionId(sessionId: string, userId: string): Promise<ExerciseLog[]>;
  getRecentSessions(limit: number, userId: string): Promise<WorkoutSession[]>;
  getTotalSessions(userId: string): Promise<number>;
  getTotalDuration(userId: string): Promise<number>;
  getExerciseProgress(exerciseId: string, userId: string): Promise<ExerciseProgressPoint[]>;
}
