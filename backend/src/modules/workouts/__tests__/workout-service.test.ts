import { beforeEach, describe, expect, it } from "vitest";

import { WorkoutService } from "../application/workout-service.js";
import type {
  NewWorkoutExerciseInput,
  NewWorkoutInput,
  Workout,
  WorkoutExercise,
  WorkoutWithExercises,
} from "../domain/types.js";
import type { WorkoutRepository } from "../ports/workout-repository.js";

function createMockWorkoutRepo(): WorkoutRepository & {
  workouts: Map<string, Workout>;
  workoutExercises: Map<string, WorkoutExercise>;
} {
  const workouts = new Map<string, Workout>();
  const workoutExercises = new Map<string, WorkoutExercise>();

  return {
    workouts,
    workoutExercises,
    async getById(id: string) {
      return workouts.get(id);
    },
    async getAll() {
      return Array.from(workouts.values());
    },
    async getByScheduledDay(day: string) {
      return Array.from(workouts.values()).filter((w) => w.scheduledDay === day);
    },
    async create(id: string, input: NewWorkoutInput) {
      const now = new Date().toISOString();
      const workout: Workout = {
        id,
        name: input.name,
        description: input.description,
        scheduledDay: input.scheduledDay,
        scheduledTime: input.scheduledTime,
        createdAt: now,
        updatedAt: now,
      };
      workouts.set(id, workout);
      return workout;
    },
    async update(id: string, patch: Partial<NewWorkoutInput>) {
      const existing = workouts.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
      workouts.set(id, updated);
      return updated;
    },
    async delete(id: string) {
      return workouts.delete(id);
    },
    async getWithExercises(id: string) {
      const workout = workouts.get(id);
      if (!workout) return undefined;
      const exercises = Array.from(workoutExercises.values())
        .filter((we) => we.workoutId === id)
        .sort((a, b) => a.orderIndex - b.orderIndex);
      return { ...workout, exercises } as WorkoutWithExercises;
    },
    async addExercise(workoutId: string, exerciseId: string, input: NewWorkoutExerciseInput) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const exercise: WorkoutExercise = {
        id,
        workoutId,
        exerciseId,
        sets: input.sets ?? 3,
        reps: input.reps ?? 10,
        weight: input.weight,
        restSeconds: input.restSeconds ?? 60,
        orderIndex: input.orderIndex ?? 0,
        createdAt: now,
      };
      workoutExercises.set(id, exercise);
      return exercise;
    },
    async updateExercise(id: string, patch: Partial<NewWorkoutExerciseInput>) {
      const existing = workoutExercises.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...patch };
      workoutExercises.set(id, updated);
      return updated;
    },
    async removeExercise(id: string) {
      return workoutExercises.delete(id);
    },
    async getExerciseById(id: string) {
      return workoutExercises.get(id);
    },
    async getExercisesByWorkoutId(workoutId: string) {
      return Array.from(workoutExercises.values()).filter((we) => we.workoutId === workoutId);
    },
    async reorderExercises(workoutId: string, exerciseIds: string[]) {
      exerciseIds.forEach((id, index) => {
        const we = workoutExercises.get(id);
        if (we && we.workoutId === workoutId) {
          workoutExercises.set(id, { ...we, orderIndex: index });
        }
      });
    },
  };
}

describe("WorkoutService", () => {
  let service: WorkoutService;
  let repo: ReturnType<typeof createMockWorkoutRepo>;

  beforeEach(() => {
    repo = createMockWorkoutRepo();
    service = new WorkoutService(repo);
  });

  it("creates a workout", async () => {
    const workout = await service.createWorkout({ name: "Morning Workout" });
    expect(workout.name).toBe("Morning Workout");
    expect(repo.workouts.size).toBe(1);
  });

  it("lists all workouts", async () => {
    await service.createWorkout({ name: "Workout 1" });
    await service.createWorkout({ name: "Workout 2" });
    expect(await service.listWorkouts()).toHaveLength(2);
  });

  it("gets a workout by id", async () => {
    const workout = await service.createWorkout({ name: "Morning Workout" });
    const found = await service.getWorkout(workout.id);
    expect(found?.name).toBe("Morning Workout");
  });

  it("gets workout with exercises", async () => {
    const workout = await service.createWorkout({ name: "Morning Workout" });
    await service.addExerciseToWorkout(workout.id, "ex-1", { sets: 3, reps: 10 });
    const found = await service.getWorkoutWithExercises(workout.id);
    expect(found?.exercises).toHaveLength(1);
  });

  it("updates a workout", async () => {
    const workout = await service.createWorkout({ name: "Morning Workout" });
    const updated = await service.updateWorkout(workout.id, { name: "Evening Workout" });
    expect(updated?.name).toBe("Evening Workout");
  });

  it("deletes a workout", async () => {
    const workout = await service.createWorkout({ name: "Morning Workout" });
    expect(await service.deleteWorkout(workout.id)).toBe(true);
    expect(repo.workouts.size).toBe(0);
  });

  it("adds exercise to workout", async () => {
    const workout = await service.createWorkout({ name: "Morning Workout" });
    const exercise = await service.addExerciseToWorkout(workout.id, "ex-1", { sets: 3, reps: 10 });
    expect(exercise.workoutId).toBe(workout.id);
    expect(exercise.sets).toBe(3);
  });

  it("updates workout exercise", async () => {
    const workout = await service.createWorkout({ name: "Morning Workout" });
    const exercise = await service.addExerciseToWorkout(workout.id, "ex-1", { sets: 3, reps: 10 });
    const updated = await service.updateWorkoutExercise(exercise.id, { sets: 5 });
    expect(updated?.sets).toBe(5);
  });

  it("removes exercise from workout", async () => {
    const workout = await service.createWorkout({ name: "Morning Workout" });
    const exercise = await service.addExerciseToWorkout(workout.id, "ex-1", { sets: 3, reps: 10 });
    expect(await service.removeExerciseFromWorkout(exercise.id)).toBe(true);
  });

  it("gets workouts by day", async () => {
    await service.createWorkout({ name: "Monday Workout", scheduledDay: "monday" });
    await service.createWorkout({ name: "Tuesday Workout", scheduledDay: "tuesday" });
    const mondayWorkouts = await service.getWorkoutsByDay("monday");
    expect(mondayWorkouts).toHaveLength(1);
    expect(mondayWorkouts[0].name).toBe("Monday Workout");
  });
});
