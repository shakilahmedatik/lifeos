import type { ExerciseProgressPoint, WorkoutSession, WorkoutStats } from "../domain/types.js";
import type { WorkoutSessionRepository } from "../ports/workout-session-repository.js";

export class WorkoutHistoryService {
  constructor(private readonly sessionRepo: WorkoutSessionRepository) {}

  getWorkoutHistory(): WorkoutSession[] {
    return this.sessionRepo.getAll();
  }

  getWorkoutStats(): WorkoutStats {
    const totalSessions = this.sessionRepo.getTotalSessions();
    const totalDuration = this.sessionRepo.getTotalDuration();
    const recentSessions = this.sessionRepo.getRecentSessions(1);

    return {
      totalWorkouts: totalSessions,
      totalSessions,
      totalDuration,
      averageDuration: totalSessions > 0 ? totalDuration / totalSessions : 0,
      lastWorkoutDate: recentSessions.length > 0 ? recentSessions[0].startedAt : undefined,
    };
  }

  getSessionsByWorkoutId(workoutId: string): WorkoutSession[] {
    return this.sessionRepo.getByWorkoutId(workoutId);
  }

  getRecentSessions(limit: number): WorkoutSession[] {
    return this.sessionRepo.getRecentSessions(limit);
  }

  getExerciseProgress(exerciseId: string): ExerciseProgressPoint[] {
    return this.sessionRepo.getExerciseProgress(exerciseId);
  }
}
