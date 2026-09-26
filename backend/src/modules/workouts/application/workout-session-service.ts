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

  async startSession(workoutId: string, userId = "default"): Promise<WorkoutSession> {
    const id = randomUUID();
    return await this.sessionRepo.create(id, workoutId, userId);
  }

  async completeSession(
    id: string,
    durationSeconds: number,
    notes?: string,
    userId = "default",
  ): Promise<WorkoutSession | undefined> {
    return await this.sessionRepo.complete(id, durationSeconds, userId, notes);
  }

  async getSession(id: string, userId = "default"): Promise<WorkoutSession | undefined> {
    return await this.sessionRepo.getById(id, userId);
  }

  async getSessionWithLogs(
    id: string,
    userId = "default",
  ): Promise<WorkoutSessionWithLogs | undefined> {
    return await this.sessionRepo.getWithLogs(id, userId);
  }

  async listSessions(userId = "default"): Promise<WorkoutSession[]> {
    return await this.sessionRepo.getAll(userId);
  }

  async getSessionsByWorkoutId(workoutId: string, userId = "default"): Promise<WorkoutSession[]> {
    return await this.sessionRepo.getByWorkoutId(workoutId, userId);
  }

  async addExerciseLog(
    sessionId: string,
    input: NewExerciseLogInput,
    userId = "default",
  ): Promise<ExerciseLog> {
    return await this.sessionRepo.addLog(sessionId, input, userId);
  }

  async getSessionLogs(sessionId: string, userId = "default"): Promise<ExerciseLog[]> {
    return await this.sessionRepo.getLogsBySessionId(sessionId, userId);
  }

  async deleteSession(id: string, userId = "default"): Promise<boolean> {
    return await this.sessionRepo.delete(id, userId);
  }

  async getRecentSessions(limit: number, userId = "default"): Promise<WorkoutSession[]> {
    return await this.sessionRepo.getRecentSessions(limit, userId);
  }
}
