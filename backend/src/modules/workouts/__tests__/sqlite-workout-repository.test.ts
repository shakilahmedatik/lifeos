import Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";
import { SqliteWorkoutRepository } from "../adapters/sqlite/sqlite-workout-repository.js";

describe("SqliteWorkoutRepository.reorderExercises", () => {
  let db: Database.Database;
  let repo: SqliteWorkoutRepository;

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(`
      CREATE TABLE workouts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        scheduled_day TEXT,
        scheduled_time TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE workout_exercises (
        id TEXT PRIMARY KEY,
        workout_id TEXT NOT NULL,
        exercise_id TEXT NOT NULL,
        sets INTEGER NOT NULL,
        reps INTEGER NOT NULL,
        reps_per_set TEXT,
        weight REAL,
        weight_per_set TEXT,
        rest_seconds INTEGER NOT NULL DEFAULT 60,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
      );
    `);
    repo = new SqliteWorkoutRepository(db);
  });

  it("reorders exercises successfully for valid duplicate-free permutation", () => {
    const workout = repo.create("w-1", { name: "Leg Day" });

    const ex1 = repo.addExercise(workout.id, "ex-1", { sets: 3, reps: 10 });
    const ex2 = repo.addExercise(workout.id, "ex-2", { sets: 4, reps: 8 });

    expect(() => repo.reorderExercises(workout.id, [ex2.id, ex1.id])).not.toThrow();

    const updatedWorkout = repo.getWithExercises(workout.id);
    expect(updatedWorkout?.exercises[0].id).toBe(ex2.id);
    expect(updatedWorkout?.exercises[1].id).toBe(ex1.id);
  });

  it("throws error for duplicate exercise IDs in payload", () => {
    const workout = repo.create("w-1", { name: "Leg Day" });

    const ex1 = repo.addExercise(workout.id, "ex-1", { sets: 3, reps: 10 });

    expect(() => repo.reorderExercises(workout.id, [ex1.id, ex1.id])).toThrow(
      "Invalid exerciseIds payload for reordering",
    );
  });

  it("throws error for mismatched payload length", () => {
    const workout = repo.create("w-1", { name: "Leg Day" });

    const ex1 = repo.addExercise(workout.id, "ex-1", { sets: 3, reps: 10 });
    repo.addExercise(workout.id, "ex-2", { sets: 4, reps: 8 });

    expect(() => repo.reorderExercises(workout.id, [ex1.id])).toThrow(
      "Invalid exerciseIds payload for reordering",
    );
  });

  it("throws error for non-member exercise IDs", () => {
    const workout = repo.create("w-1", { name: "Leg Day" });

    const ex1 = repo.addExercise(workout.id, "ex-1", { sets: 3, reps: 10 });

    expect(() => repo.reorderExercises(workout.id, [ex1.id, "random-id"])).toThrow(
      "Invalid exerciseIds payload for reordering",
    );
  });
});
