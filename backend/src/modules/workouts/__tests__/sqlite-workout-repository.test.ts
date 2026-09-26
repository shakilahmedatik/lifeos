import { beforeEach, describe, expect, it } from "vitest";
import type { DrizzleClient } from "../../../shared/db.js";
import { createTestDatabase } from "../../../shared/test-db.js";
import { DrizzleWorkoutRepository } from "../adapters/sqlite/sqlite-workout-repository.js";

describe("DrizzleWorkoutRepository.reorderExercises", () => {
  let db: DrizzleClient;
  let repo: DrizzleWorkoutRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    repo = new DrizzleWorkoutRepository(db);
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
