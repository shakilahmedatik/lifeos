import type { ExerciseProgressPoint, WorkoutSession, WorkoutStats } from "../domain/types.js";
import type { WorkoutSessionRepository } from "../ports/workout-session-repository.js";

export class WorkoutHistoryService {
  constructor(private readonly sessionRepo: WorkoutSessionRepository) {}

  async getWorkoutHistory(userId = "default"): Promise<WorkoutSession[]> {
    return await this.sessionRepo.getAll(userId);
  }

  async getWorkoutStats(userId = "default"): Promise<WorkoutStats> {
    const totalSessions = await this.sessionRepo.getTotalSessions(userId);
    const totalDuration = await this.sessionRepo.getTotalDuration(userId);
    const recentSessions = await this.sessionRepo.getRecentSessions(1, userId);

    return {
      totalWorkouts: totalSessions,
      totalSessions,
      totalDuration,
      averageDuration: totalSessions > 0 ? totalDuration / totalSessions : 0,
      lastWorkoutDate: recentSessions.length > 0 ? recentSessions[0].startedAt : undefined,
    };
  }

  async getSessionsByWorkoutId(workoutId: string, userId = "default"): Promise<WorkoutSession[]> {
    return await this.sessionRepo.getByWorkoutId(workoutId, userId);
  }

  async getRecentSessions(limit: number, userId = "default"): Promise<WorkoutSession[]> {
    return await this.sessionRepo.getRecentSessions(limit, userId);
  }

  async getExerciseProgress(
    exerciseId: string,
    userId = "default",
  ): Promise<ExerciseProgressPoint[]> {
    return await this.sessionRepo.getExerciseProgress(exerciseId, userId);
  }
}
