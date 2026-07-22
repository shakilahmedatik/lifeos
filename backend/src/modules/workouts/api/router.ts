import { Router } from "express";

import type { ExerciseService } from "../application/exercise-service.js";
import type { WorkoutHistoryService } from "../application/workout-history-service.js";
import type { WorkoutService } from "../application/workout-service.js";
import type { WorkoutSessionService } from "../application/workout-session-service.js";

export function createWorkoutsRouter(
  workoutService: WorkoutService,
  exerciseService: ExerciseService,
  workoutSessionService: WorkoutSessionService,
  workoutHistoryService: WorkoutHistoryService,
): Router {
  const router = Router();

  // Workout routes
  router.get("/", (_req, res) => {
    const workouts = workoutService.listWorkouts();
    res.json(workouts);
  });

  router.get("/:id", (req, res) => {
    const workout = workoutService.getWorkoutWithExercises(req.params.id);
    if (!workout) {
      res.status(404).json({ error: "Workout not found" });
      return;
    }
    res.json(workout);
  });

  router.post("/", (req, res) => {
    const workout = workoutService.createWorkout(req.body);
    res.status(201).json(workout);
  });

  router.patch("/:id", (req, res) => {
    const workout = workoutService.updateWorkout(req.params.id, req.body);
    if (!workout) {
      res.status(404).json({ error: "Workout not found" });
      return;
    }
    res.json(workout);
  });

  router.delete("/:id", (req, res) => {
    const deleted = workoutService.deleteWorkout(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Workout not found" });
      return;
    }
    res.status(204).send();
  });

  // Workout exercises
  router.post("/:id/exercises", (req, res) => {
    const workout = workoutService.getWorkout(req.params.id);
    if (!workout) {
      res.status(404).json({ error: "Workout not found" });
      return;
    }
    const exercise = workoutService.addExerciseToWorkout(
      req.params.id,
      req.body.exerciseId,
      req.body,
    );
    res.status(201).json(exercise);
  });

  router.patch("/:workoutId/exercises/:exerciseId", (req, res) => {
    const exercise = workoutService.updateWorkoutExercise(req.params.exerciseId, req.body);
    if (!exercise) {
      res.status(404).json({ error: "Exercise not found" });
      return;
    }
    res.json(exercise);
  });

  router.delete("/:workoutId/exercises/:exerciseId", (req, res) => {
    const deleted = workoutService.removeExerciseFromWorkout(req.params.exerciseId);
    if (!deleted) {
      res.status(404).json({ error: "Exercise not found" });
      return;
    }
    res.status(204).send();
  });

  // Exercise routes
  router.get("/exercises", (_req, res) => {
    const exercises = exerciseService.listExercises();
    res.json(exercises);
  });

  router.get("/exercises/:id", (req, res) => {
    const exercise = exerciseService.getExercise(req.params.id);
    if (!exercise) {
      res.status(404).json({ error: "Exercise not found" });
      return;
    }
    res.json(exercise);
  });

  router.post("/exercises", (req, res) => {
    try {
      const exercise = exerciseService.createExercise(req.body);
      res.status(201).json(exercise);
    } catch (error) {
      if (error instanceof Error && error.message === "Exercise with this name already exists") {
        res.status(409).json({ error: error.message });
        return;
      }
      throw error;
    }
  });

  router.patch("/exercises/:id", (req, res) => {
    const exercise = exerciseService.updateExercise(req.params.id, req.body);
    if (!exercise) {
      res.status(404).json({ error: "Exercise not found" });
      return;
    }
    res.json(exercise);
  });

  router.delete("/exercises/:id", (req, res) => {
    const deleted = exerciseService.deleteExercise(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Exercise not found" });
      return;
    }
    res.status(204).send();
  });

  // Session routes
  router.get("/sessions", (_req, res) => {
    const sessions = workoutSessionService.listSessions();
    res.json(sessions);
  });

  router.get("/sessions/:id", (req, res) => {
    const session = workoutSessionService.getSessionWithLogs(req.params.id);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.json(session);
  });

  router.post("/sessions", (req, res) => {
    const session = workoutSessionService.startSession(req.body.workoutId);
    res.status(201).json(session);
  });

  router.patch("/sessions/:id/complete", (req, res) => {
    const session = workoutSessionService.completeSession(
      req.params.id,
      req.body.durationSeconds,
      req.body.notes,
    );
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.json(session);
  });

  router.delete("/sessions/:id", (req, res) => {
    const deleted = workoutSessionService.deleteSession(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.status(204).send();
  });

  // Session logs
  router.post("/sessions/:id/logs", (req, res) => {
    const session = workoutSessionService.getSession(req.params.id);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    const log = workoutSessionService.addExerciseLog(req.params.id, req.body);
    res.status(201).json(log);
  });

  router.get("/sessions/:id/logs", (req, res) => {
    const session = workoutSessionService.getSession(req.params.id);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    const logs = workoutSessionService.getSessionLogs(req.params.id);
    res.json(logs);
  });

  // History routes
  router.get("/history", (_req, res) => {
    const history = workoutHistoryService.getWorkoutHistory();
    res.json(history);
  });

  router.get("/history/stats", (_req, res) => {
    const stats = workoutHistoryService.getWorkoutStats();
    res.json(stats);
  });

  router.get("/history/recent", (req, res) => {
    const limit = Number(req.query.limit) || 10;
    const sessions = workoutHistoryService.getRecentSessions(limit);
    res.json(sessions);
  });

  return router;
}
