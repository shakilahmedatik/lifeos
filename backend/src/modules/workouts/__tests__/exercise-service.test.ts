import { beforeEach, describe, expect, it } from "vitest";

import { ExerciseService } from "../application/exercise-service.js";
import type { Exercise, NewExerciseInput } from "../domain/types.js";
import type { ExerciseRepository } from "../ports/exercise-repository.js";

function createMockExerciseRepo(): ExerciseRepository & {
  exercises: Map<string, Exercise>;
} {
  const exercises = new Map<string, Exercise>();

  return {
    exercises,
    async getById(id: string) {
      return exercises.get(id);
    },
    async getAll() {
      return Array.from(exercises.values());
    },
    async getByMuscleGroup(muscleGroup: string) {
      return Array.from(exercises.values()).filter((e) => e.muscleGroup === muscleGroup);
    },
    async create(id: string, input: NewExerciseInput) {
      const now = new Date().toISOString();
      const exercise: Exercise = {
        id,
        name: input.name,
        muscleGroup: input.muscleGroup ?? "general",
        videoUrl: input.videoUrl,
        createdAt: now,
        updatedAt: now,
      };
      exercises.set(id, exercise);
      return exercise;
    },
    async update(id: string, patch: Partial<NewExerciseInput>) {
      const existing = exercises.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
      exercises.set(id, updated);
      return updated;
    },
    async delete(id: string) {
      return exercises.delete(id);
    },
    async getByName(name: string) {
      return Array.from(exercises.values()).find((e) => e.name === name);
    },
  };
}

describe("ExerciseService", () => {
  let service: ExerciseService;
  let repo: ReturnType<typeof createMockExerciseRepo>;

  beforeEach(() => {
    repo = createMockExerciseRepo();
    service = new ExerciseService(repo);
  });

  it("creates an exercise", async () => {
    const exercise = await service.createExercise({ name: "Bench Press", muscleGroup: "chest" });
    expect(exercise.name).toBe("Bench Press");
    expect(exercise.muscleGroup).toBe("chest");
    expect(repo.exercises.size).toBe(1);
  });

  it("creates exercises with biceps, triceps, and general muscle groups", async () => {
    const ex1 = await service.createExercise({ name: "Bicep Curls", muscleGroup: "biceps" });
    const ex2 = await service.createExercise({ name: "Tricep Pushdown", muscleGroup: "triceps" });
    const ex3 = await service.createExercise({
      name: "Stretching",
      muscleGroup: "general",
      videoUrl: "",
    });

    expect(ex1.muscleGroup).toBe("biceps");
    expect(ex2.muscleGroup).toBe("triceps");
    expect(ex3.muscleGroup).toBe("general");
    expect(ex3.videoUrl).toBe("");
  });

  it("rejects duplicate names", async () => {
    await service.createExercise({ name: "Bench Press" });
    await expect(service.createExercise({ name: "Bench Press" })).rejects.toThrow("already exists");
  });

  it("lists all exercises", async () => {
    await service.createExercise({ name: "Bench Press" });
    await service.createExercise({ name: "Squats" });
    expect(await service.listExercises()).toHaveLength(2);
  });

  it("gets an exercise by id", async () => {
    const exercise = await service.createExercise({ name: "Bench Press" });
    const found = await service.getExercise(exercise.id);
    expect(found?.name).toBe("Bench Press");
  });

  it("updates an exercise", async () => {
    const exercise = await service.createExercise({ name: "Bench Press" });
    const updated = await service.updateExercise(exercise.id, { name: "Incline Bench Press" });
    expect(updated?.name).toBe("Incline Bench Press");
  });

  it("rejects duplicate names on update", async () => {
    await service.createExercise({ name: "Bench Press" });
    const exercise2 = await service.createExercise({ name: "Squats" });
    await expect(service.updateExercise(exercise2.id, { name: "Bench Press" })).rejects.toThrow(
      "already exists",
    );
  });

  it("deletes an exercise", async () => {
    const exercise = await service.createExercise({ name: "Bench Press" });
    expect(await service.deleteExercise(exercise.id)).toBe(true);
    expect(repo.exercises.size).toBe(0);
  });

  it("gets exercises by muscle group", async () => {
    await service.createExercise({ name: "Bench Press", muscleGroup: "chest" });
    await service.createExercise({ name: "Squats", muscleGroup: "legs" });
    const chestExercises = await service.getExercisesByMuscleGroup("chest");
    expect(chestExercises).toHaveLength(1);
    expect(chestExercises[0].name).toBe("Bench Press");
  });
});
