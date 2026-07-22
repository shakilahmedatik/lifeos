import type {
  ExerciseLog,
  NewExerciseLogInput,
  WorkoutSession,
  WorkoutSessionWithLogs,
} from "../domain/types.js";

export interface WorkoutSessionRepository {
  getById(id: string): WorkoutSession | undefined;
  getAll(): WorkoutSession[];
  getByWorkoutId(workoutId: string): WorkoutSession[];
  create(id: string, workoutId: string): WorkoutSession;
  complete(id: string, durationSeconds: number, notes?: string): WorkoutSession | undefined;
  delete(id: string): boolean;
  getWithLogs(id: string): WorkoutSessionWithLogs | undefined;
  addLog(sessionId: string, input: NewExerciseLogInput): ExerciseLog;
  getLogsBySessionId(sessionId: string): ExerciseLog[];
  getRecentSessions(limit: number): WorkoutSession[];
  getTotalSessions(): number;
  getTotalDuration(): number;
}
