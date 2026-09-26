import type { DrizzleClient } from "../../shared/db.js";
import { DrizzleExerciseRepository } from "./adapters/sqlite/sqlite-exercise-repository.js";
import { DrizzleWorkoutRepository } from "./adapters/sqlite/sqlite-workout-repository.js";
import { DrizzleWorkoutSessionRepository } from "./adapters/sqlite/sqlite-workout-session-repository.js";
import { createWorkoutsRouter } from "./api/router.js";
import { ExerciseService } from "./application/exercise-service.js";
import { WorkoutHistoryService } from "./application/workout-history-service.js";
import { WorkoutService } from "./application/workout-service.js";
import { WorkoutSessionService } from "./application/workout-session-service.js";

export function initWorkoutsModule(db: DrizzleClient) {
  const workoutRepo = new DrizzleWorkoutRepository(db);
  const exerciseRepo = new DrizzleExerciseRepository(db);
  const workoutSessionRepo = new DrizzleWorkoutSessionRepository(db);

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
