import type {
  ExerciseLog,
  ExerciseProgressPoint,
  NewExerciseLogInput,
  WorkoutSession,
  WorkoutSessionWithLogs,
} from "../domain/types.js";

export interface WorkoutSessionRepository {
  getById(id: string): Promise<WorkoutSession | undefined>;
  getAll(): Promise<WorkoutSession[]>;
  getByWorkoutId(workoutId: string): Promise<WorkoutSession[]>;
  create(id: string, workoutId: string): Promise<WorkoutSession>;
  complete(
    id: string,
    durationSeconds: number,
    notes?: string,
  ): Promise<WorkoutSession | undefined>;
  delete(id: string): Promise<boolean>;
  getWithLogs(id: string): Promise<WorkoutSessionWithLogs | undefined>;
  addLog(sessionId: string, input: NewExerciseLogInput): Promise<ExerciseLog>;
  getLogsBySessionId(sessionId: string): Promise<ExerciseLog[]>;
  getRecentSessions(limit: number): Promise<WorkoutSession[]>;
  getTotalSessions(): Promise<number>;
  getTotalDuration(): Promise<number>;
  getExerciseProgress(exerciseId: string): Promise<ExerciseProgressPoint[]>;
}
