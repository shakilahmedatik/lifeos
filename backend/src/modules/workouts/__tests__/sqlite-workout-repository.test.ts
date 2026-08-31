import { type Client, createClient } from "@libsql/client";
import { beforeEach, describe, expect, it } from "vitest";
import { SqliteWorkoutRepository } from "../adapters/sqlite/sqlite-workout-repository.js";

describe("SqliteWorkoutRepository.reorderExercises", () => {
  let client: Client;
  let repo: SqliteWorkoutRepository;

  beforeEach(async () => {
    client = createClient({ url: ":memory:" });
    await client.execute(`
      CREATE TABLE workouts (
        id TEXT PRIMARY KEY,
        user_id TEXT DEFAULT '',
        name TEXT NOT NULL,
        description TEXT,
        scheduled_day TEXT,
        scheduled_time TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );
    `);
    await client.execute(`
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
        deleted_at TEXT,
        FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
      );
    `);
    repo = new SqliteWorkoutRepository(client);
  });

  it("reorders exercises successfully for valid duplicate-free permutation", async () => {
    const workout = await repo.create("w-1", { name: "Leg Day" });

    const ex1 = await repo.addExercise(workout.id, "ex-1", { sets: 3, reps: 10 });
    const ex2 = await repo.addExercise(workout.id, "ex-2", { sets: 4, reps: 8 });

    await expect(repo.reorderExercises(workout.id, [ex2.id, ex1.id])).resolves.not.toThrow();

    const updatedWorkout = await repo.getWithExercises(workout.id);
    expect(updatedWorkout?.exercises[0].id).toBe(ex2.id);
    expect(updatedWorkout?.exercises[1].id).toBe(ex1.id);
  });

  it("throws error for duplicate exercise IDs in payload", async () => {
    const workout = await repo.create("w-1", { name: "Leg Day" });

    const ex1 = await repo.addExercise(workout.id, "ex-1", { sets: 3, reps: 10 });

    await expect(repo.reorderExercises(workout.id, [ex1.id, ex1.id])).rejects.toThrow(
      "Invalid exerciseIds payload for reordering",
    );
  });

  it("throws error for mismatched payload length", async () => {
    const workout = await repo.create("w-1", { name: "Leg Day" });

    const ex1 = await repo.addExercise(workout.id, "ex-1", { sets: 3, reps: 10 });
    await repo.addExercise(workout.id, "ex-2", { sets: 4, reps: 8 });

    await expect(repo.reorderExercises(workout.id, [ex1.id])).rejects.toThrow(
      "Invalid exerciseIds payload for reordering",
    );
  });

  it("throws error for non-member exercise IDs", async () => {
    const workout = await repo.create("w-1", { name: "Leg Day" });

    const ex1 = await repo.addExercise(workout.id, "ex-1", { sets: 3, reps: 10 });

    await expect(repo.reorderExercises(workout.id, [ex1.id, "random-id"])).rejects.toThrow(
      "Invalid exerciseIds payload for reordering",
    );
  });
});
