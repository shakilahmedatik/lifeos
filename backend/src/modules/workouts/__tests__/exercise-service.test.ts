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
    getById(id: string) {
      return exercises.get(id);
    },
    getAll() {
      return Array.from(exercises.values());
    },
    getByMuscleGroup(muscleGroup: string) {
      return Array.from(exercises.values()).filter((e) => e.muscleGroup === muscleGroup);
    },
    create(id: string, input: NewExerciseInput) {
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
    update(id: string, patch: Partial<NewExerciseInput>) {
      const existing = exercises.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
      exercises.set(id, updated);
      return updated;
    },
    delete(id: string) {
      return exercises.delete(id);
    },
    getByName(name: string) {
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

  it("creates an exercise", () => {
    const exercise = service.createExercise({ name: "Bench Press", muscleGroup: "chest" });
    expect(exercise.name).toBe("Bench Press");
    expect(exercise.muscleGroup).toBe("chest");
    expect(repo.exercises.size).toBe(1);
  });

  it("rejects duplicate names", () => {
    service.createExercise({ name: "Bench Press" });
    expect(() => service.createExercise({ name: "Bench Press" })).toThrow("already exists");
  });

  it("lists all exercises", () => {
    service.createExercise({ name: "Bench Press" });
    service.createExercise({ name: "Squats" });
    expect(service.listExercises()).toHaveLength(2);
  });

  it("gets an exercise by id", () => {
    const exercise = service.createExercise({ name: "Bench Press" });
    const found = service.getExercise(exercise.id);
    expect(found?.name).toBe("Bench Press");
  });

  it("updates an exercise", () => {
    const exercise = service.createExercise({ name: "Bench Press" });
    const updated = service.updateExercise(exercise.id, { name: "Incline Bench Press" });
    expect(updated?.name).toBe("Incline Bench Press");
  });

  it("rejects duplicate names on update", () => {
    service.createExercise({ name: "Bench Press" });
    const exercise2 = service.createExercise({ name: "Squats" });
    expect(() => service.updateExercise(exercise2.id, { name: "Bench Press" })).toThrow(
      "already exists",
    );
  });

  it("deletes an exercise", () => {
    const exercise = service.createExercise({ name: "Bench Press" });
    expect(service.deleteExercise(exercise.id)).toBe(true);
    expect(repo.exercises.size).toBe(0);
  });

  it("gets exercises by muscle group", () => {
    service.createExercise({ name: "Bench Press", muscleGroup: "chest" });
    service.createExercise({ name: "Squats", muscleGroup: "legs" });
    const chestExercises = service.getExercisesByMuscleGroup("chest");
    expect(chestExercises).toHaveLength(1);
    expect(chestExercises[0].name).toBe("Bench Press");
  });
});
