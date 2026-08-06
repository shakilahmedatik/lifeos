import type { Client } from "@libsql/client";
import { SqliteExerciseRepository } from "./adapters/sqlite/sqlite-exercise-repository.js";
import { SqliteWorkoutRepository } from "./adapters/sqlite/sqlite-workout-repository.js";
import { SqliteWorkoutSessionRepository } from "./adapters/sqlite/sqlite-workout-session-repository.js";
import { createWorkoutsRouter } from "./api/router.js";
import { ExerciseService } from "./application/exercise-service.js";
import { WorkoutHistoryService } from "./application/workout-history-service.js";
import { WorkoutService } from "./application/workout-service.js";
import { WorkoutSessionService } from "./application/workout-session-service.js";

export function initWorkoutsModule(client: Client) {
  const workoutRepo = new SqliteWorkoutRepository(client);
  const exerciseRepo = new SqliteExerciseRepository(client);
  const workoutSessionRepo = new SqliteWorkoutSessionRepository(client);

  const workoutService = new WorkoutService(workoutRepo);
  const exerciseService = new ExerciseService(exerciseRepo);
  const workoutSessionService = new WorkoutSessionService(workoutSessionRepo);
  const workoutHistoryService = new WorkoutHistoryService(workoutSessionRepo);

  const router = createWorkoutsRouter(
    workoutService,
    exerciseService,
    workoutSessionService,
    workoutHistoryService,
  );

  return {
    workoutRepo,
    workoutSessionRepo,
    workoutService,
    exerciseService,
    workoutSessionService,
    workoutHistoryService,
    router,
  };
}
