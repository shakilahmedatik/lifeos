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

  async startSession(workoutId: string): Promise<WorkoutSession> {
    const id = randomUUID();
    return await this.sessionRepo.create(id, workoutId);
  }

  async completeSession(
    id: string,
    durationSeconds: number,
    notes?: string,
  ): Promise<WorkoutSession | undefined> {
    return await this.sessionRepo.complete(id, durationSeconds, notes);
  }

  async getSession(id: string): Promise<WorkoutSession | undefined> {
    return await this.sessionRepo.getById(id);
  }

  async getSessionWithLogs(id: string): Promise<WorkoutSessionWithLogs | undefined> {
    return await this.sessionRepo.getWithLogs(id);
  }

  async listSessions(): Promise<WorkoutSession[]> {
    return await this.sessionRepo.getAll();
  }

  async getSessionsByWorkoutId(workoutId: string): Promise<WorkoutSession[]> {
    return await this.sessionRepo.getByWorkoutId(workoutId);
  }

  async addExerciseLog(sessionId: string, input: NewExerciseLogInput): Promise<ExerciseLog> {
    return await this.sessionRepo.addLog(sessionId, input);
  }

  async getSessionLogs(sessionId: string): Promise<ExerciseLog[]> {
    return await this.sessionRepo.getLogsBySessionId(sessionId);
  }

  async deleteSession(id: string): Promise<boolean> {
    return await this.sessionRepo.delete(id);
  }

  async getRecentSessions(limit: number): Promise<WorkoutSession[]> {
    return await this.sessionRepo.getRecentSessions(limit);
  }
}
