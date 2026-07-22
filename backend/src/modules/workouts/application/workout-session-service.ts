import { randomUUID } from "node:crypto";

import type {
  ExerciseLog,
  NewExerciseLogInput,
  WorkoutSession,
  WorkoutSessionWithLogs,
} from "../domain/types.js";
import type { WorkoutSessionRepository } from "../ports/workout-session-repository.js";

export class WorkoutSessionService {
  constructor(private readonly sessionRepo: WorkoutSessionRepository) {}

  startSession(workoutId: string): WorkoutSession {
    const id = randomUUID();
    return this.sessionRepo.create(id, workoutId);
  }

  completeSession(id: string, durationSeconds: number, notes?: string): WorkoutSession | undefined {
    return this.sessionRepo.complete(id, durationSeconds, notes);
  }

  getSession(id: string): WorkoutSession | undefined {
    return this.sessionRepo.getById(id);
  }

  getSessionWithLogs(id: string): WorkoutSessionWithLogs | undefined {
    return this.sessionRepo.getWithLogs(id);
  }

  listSessions(): WorkoutSession[] {
    return this.sessionRepo.getAll();
  }

  getSessionsByWorkoutId(workoutId: string): WorkoutSession[] {
    return this.sessionRepo.getByWorkoutId(workoutId);
  }

  addExerciseLog(sessionId: string, input: NewExerciseLogInput): ExerciseLog {
    return this.sessionRepo.addLog(sessionId, input);
  }

  getSessionLogs(sessionId: string): ExerciseLog[] {
    return this.sessionRepo.getLogsBySessionId(sessionId);
  }

  deleteSession(id: string): boolean {
    return this.sessionRepo.delete(id);
  }

  getRecentSessions(limit: number): WorkoutSession[] {
    return this.sessionRepo.getRecentSessions(limit);
  }
}
