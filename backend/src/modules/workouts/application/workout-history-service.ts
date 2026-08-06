import type { ExerciseProgressPoint, WorkoutSession, WorkoutStats } from "../domain/types.js";
import type { WorkoutSessionRepository } from "../ports/workout-session-repository.js";

export class WorkoutHistoryService {
  constructor(private readonly sessionRepo: WorkoutSessionRepository) {}

  async getWorkoutHistory(): Promise<WorkoutSession[]> {
    return await this.sessionRepo.getAll();
  }

  async getWorkoutStats(): Promise<WorkoutStats> {
    const totalSessions = await this.sessionRepo.getTotalSessions();
    const totalDuration = await this.sessionRepo.getTotalDuration();
    const recentSessions = await this.sessionRepo.getRecentSessions(1);

    return {
      totalWorkouts: totalSessions,
      totalSessions,
      totalDuration,
      averageDuration: totalSessions > 0 ? totalDuration / totalSessions : 0,
      lastWorkoutDate: recentSessions.length > 0 ? recentSessions[0].startedAt : undefined,
    };
  }

  async getSessionsByWorkoutId(workoutId: string): Promise<WorkoutSession[]> {
    return await this.sessionRepo.getByWorkoutId(workoutId);
  }

  async getRecentSessions(limit: number): Promise<WorkoutSession[]> {
    return await this.sessionRepo.getRecentSessions(limit);
  }

  async getExerciseProgress(exerciseId: string): Promise<ExerciseProgressPoint[]> {
    return await this.sessionRepo.getExerciseProgress(exerciseId);
  }
}
