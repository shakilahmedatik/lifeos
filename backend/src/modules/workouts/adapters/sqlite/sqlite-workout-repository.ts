import { randomUUID } from "node:crypto";
import { and, asc, count, desc, eq, isNull, or } from "drizzle-orm";

import type { DrizzleClient } from "../../../../shared/db.js";
import { workoutExercises, workouts } from "../../../../shared/schema.js";
import type {
  NewWorkoutExerciseInput,
  NewWorkoutInput,
  Workout,
  WorkoutExercise,
  WorkoutWithExercises,
} from "../../domain/types.js";
import type { WorkoutRepository } from "../../ports/workout-repository.js";

function rowToWorkout(row: typeof workouts.$inferSelect & { exerciseCount?: number }): Workout {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    scheduledDay: row.scheduledDay as Workout["scheduledDay"],
    scheduledTime: row.scheduledTime ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    exerciseCount: row.exerciseCount,
  };
}

function rowToWorkoutExercise(row: typeof workoutExercises.$inferSelect): WorkoutExercise {
  return {
    id: row.id,
    workoutId: row.workoutId,
    exerciseId: row.exerciseId,
    sets: row.sets,
    reps: row.reps,
    weight: row.weight ?? undefined,
    weights: row.weightPerSet ? JSON.parse(row.weightPerSet) : undefined,
    repsArray: row.repsPerSet ? JSON.parse(row.repsPerSet) : undefined,
    restSeconds: row.restSeconds,
    orderIndex: row.orderIndex,
    createdAt: row.createdAt,
  };
}

function userScope(userId: string) {
  return and(or(eq(workouts.userId, userId), eq(workouts.userId, "")), isNull(workouts.deletedAt));
}

export class DrizzleWorkoutRepository implements WorkoutRepository {
  constructor(private readonly db: DrizzleClient) {}

  async getById(id: string, userId = "default"): Promise<Workout | undefined> {
    const [row] = await this.db
      .select()
      .from(workouts)
      .where(and(eq(workouts.id, id), userScope(userId)));
    return row ? rowToWorkout(row) : undefined;
  }

  async getAll(userId = "default"): Promise<Workout[]> {
    const rows = await this.db
      .select({
        id: workouts.id,
        userId: workouts.userId,
        name: workouts.name,
        description: workouts.description,
        scheduledDay: workouts.scheduledDay,
        scheduledTime: workouts.scheduledTime,
        createdAt: workouts.createdAt,
        updatedAt: workouts.updatedAt,
        deletedAt: workouts.deletedAt,
        exerciseCount: count(workoutExercises.id),
      })
      .from(workouts)
      .leftJoin(
        workoutExercises,
        and(eq(workouts.id, workoutExercises.workoutId), isNull(workoutExercises.deletedAt)),
      )
      .where(userScope(userId))
      .groupBy(workouts.id)
      .orderBy(desc(workouts.createdAt));
    return rows.map(rowToWorkout);
  }

  async getByScheduledDay(day: string, userId = "default"): Promise<Workout[]> {
    const rows = await this.db
      .select({
        id: workouts.id,
        userId: workouts.userId,
        name: workouts.name,
        description: workouts.description,
        scheduledDay: workouts.scheduledDay,
        scheduledTime: workouts.scheduledTime,
        createdAt: workouts.createdAt,
        updatedAt: workouts.updatedAt,
        deletedAt: workouts.deletedAt,
        exerciseCount: count(workoutExercises.id),
      })
      .from(workouts)
      .leftJoin(
        workoutExercises,
        and(eq(workouts.id, workoutExercises.workoutId), isNull(workoutExercises.deletedAt)),
      )
      .where(and(eq(workouts.scheduledDay, day), userScope(userId)))
      .groupBy(workouts.id)
      .orderBy(asc(workouts.scheduledTime));
    return rows.map(rowToWorkout);
  }

  async create(id: string, input: NewWorkoutInput, userId = "default"): Promise<Workout> {
    const now = new Date().toISOString();
    await this.db.insert(workouts).values({
      id,
      userId,
      name: input.name,
      description: input.description ?? null,
      scheduledDay: input.scheduledDay ?? null,
      scheduledTime: input.scheduledTime ?? null,
      createdAt: now,
      updatedAt: now,
    });

    return (await this.getById(id, userId)) as Workout;
  }

  async update(
    id: string,
    patch: Partial<NewWorkoutInput>,
    userId = "default",
  ): Promise<Workout | undefined> {
    const existing = await this.getById(id, userId);
    if (!existing) return undefined;

    const updates: Record<string, unknown> = {};
    if (patch.name !== undefined) updates.name = patch.name;
    if (patch.description !== undefined) updates.description = patch.description;
    if (patch.scheduledDay !== undefined) updates.scheduledDay = patch.scheduledDay;
    if (patch.scheduledTime !== undefined) updates.scheduledTime = patch.scheduledTime;

    if (Object.keys(updates).length === 0) return existing;

    updates.updatedAt = new Date().toISOString();

    await this.db
      .update(workouts)
      .set(updates)
      .where(and(eq(workouts.id, id), userScope(userId)));

    return await this.getById(id, userId);
  }

  async completeSession(id: string, durationSeconds: number, userId = "default"): Promise<void> {
    // This is handled by workout session repository
    const { workoutSessions } = await import("../../../../shared/schema.js");
    await this.db
      .update(workoutSessions)
      .set({ completedAt: new Date().toISOString(), durationSeconds })
      .where(
        and(
          eq(workoutSessions.id, id),
          or(eq(workoutSessions.userId, userId), eq(workoutSessions.userId, "")),
          isNull(workoutSessions.deletedAt),
        ),
      );
  }

  async cancelSession(id: string, userId = "default"): Promise<void> {
    const { workoutSessions } = await import("../../../../shared/schema.js");
    const now = new Date().toISOString();
    await this.db
      .update(workoutSessions)
      .set({ deletedAt: now })
      .where(
        and(
          eq(workoutSessions.id, id),
          or(eq(workoutSessions.userId, userId), eq(workoutSessions.userId, "")),
          isNull(workoutSessions.deletedAt),
        ),
      );
  }

  async reorderExercises(
    workoutId: string,
    exerciseIds: string[],
    _userId = "default",
  ): Promise<void> {
    const currentRows = await this.db
      .select({ id: workoutExercises.id })
      .from(workoutExercises)
      .where(and(eq(workoutExercises.workoutId, workoutId), isNull(workoutExercises.deletedAt)));

    const currentIds = currentRows.map((row) => row.id);
    const isDuplicateFree = new Set(exerciseIds).size === exerciseIds.length;
    const hasSameLength = exerciseIds.length === currentIds.length;
    const currentSet = new Set(currentIds);
    const hasCompleteMembership = hasSameLength && exerciseIds.every((id) => currentSet.has(id));

    if (!isDuplicateFree || !hasSameLength || !hasCompleteMembership) {
      throw new Error("Invalid exerciseIds payload for reordering");
    }

    for (let i = 0; i < exerciseIds.length; i++) {
      await this.db
        .update(workoutExercises)
        .set({ orderIndex: i })
        .where(
          and(
            eq(workoutExercises.id, exerciseIds[i]),
            eq(workoutExercises.workoutId, workoutId),
            isNull(workoutExercises.deletedAt),
          ),
        );
    }
  }

  async delete(id: string, userId = "default"): Promise<boolean> {
    const now = new Date().toISOString();
    const result = await this.db
      .update(workouts)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(workouts.id, id), userScope(userId)));
    return result.rowsAffected > 0;
  }

  async getWithExercises(
    id: string,
    userId = "default",
  ): Promise<WorkoutWithExercises | undefined> {
    const workout = await this.getById(id, userId);
    if (!workout) return undefined;

    const exerciseRows = await this.db
      .select()
      .from(workoutExercises)
      .where(and(eq(workoutExercises.workoutId, id), isNull(workoutExercises.deletedAt)))
      .orderBy(asc(workoutExercises.orderIndex));

    return {
      ...workout,
      exercises: exerciseRows.map(rowToWorkoutExercise),
    };
  }

  async addExercise(
    workoutId: string,
    exerciseId: string,
    input: NewWorkoutExerciseInput,
    _userId = "default",
  ): Promise<WorkoutExercise> {
    const id = randomUUID();
    const now = new Date().toISOString();

    await this.db.insert(workoutExercises).values({
      id,
      workoutId,
      exerciseId,
      sets: input.sets ?? 3,
      reps: input.reps ?? 10,
      repsPerSet: input.repsArray ? JSON.stringify(input.repsArray) : null,
      weight: input.weight ?? null,
      weightPerSet: input.weights ? JSON.stringify(input.weights) : null,
      restSeconds: input.restSeconds ?? 60,
      orderIndex: input.orderIndex ?? 0,
      createdAt: now,
    });

    return (await this.getExerciseById(id)) as WorkoutExercise;
  }

  async updateExercise(
    id: string,
    patch: Partial<NewWorkoutExerciseInput>,
    _userId = "default",
  ): Promise<WorkoutExercise | undefined> {
    const existing = await this.getExerciseById(id);
    if (!existing) return undefined;

    const updates: Record<string, unknown> = {};
    if (patch.sets !== undefined) updates.sets = patch.sets;
    if (patch.reps !== undefined) updates.reps = patch.reps;
    if (patch.repsArray !== undefined)
      updates.repsPerSet = patch.repsArray ? JSON.stringify(patch.repsArray) : null;
    if (patch.weight !== undefined) updates.weight = patch.weight;
    if (patch.weights !== undefined)
      updates.weightPerSet = patch.weights ? JSON.stringify(patch.weights) : null;
    if (patch.restSeconds !== undefined) updates.restSeconds = patch.restSeconds;
    if (patch.orderIndex !== undefined) updates.orderIndex = patch.orderIndex;

    if (Object.keys(updates).length === 0) return existing;

    await this.db
      .update(workoutExercises)
      .set(updates)
      .where(and(eq(workoutExercises.id, id), isNull(workoutExercises.deletedAt)));

    return await this.getExerciseById(id);
  }

  async removeExercise(id: string, _userId = "default"): Promise<boolean> {
    const now = new Date().toISOString();
    const result = await this.db
      .update(workoutExercises)
      .set({ deletedAt: now })
      .where(and(eq(workoutExercises.id, id), isNull(workoutExercises.deletedAt)));
    return result.rowsAffected > 0;
  }

  async getExerciseById(id: string, _userId = "default"): Promise<WorkoutExercise | undefined> {
    const [row] = await this.db
      .select()
      .from(workoutExercises)
      .where(and(eq(workoutExercises.id, id), isNull(workoutExercises.deletedAt)));
    return row ? rowToWorkoutExercise(row) : undefined;
  }

  async getExercisesByWorkoutId(
    workoutId: string,
    _userId = "default",
  ): Promise<WorkoutExercise[]> {
    const rows = await this.db
      .select()
      .from(workoutExercises)
      .where(and(eq(workoutExercises.workoutId, workoutId), isNull(workoutExercises.deletedAt)))
      .orderBy(asc(workoutExercises.orderIndex));
    return rows.map(rowToWorkoutExercise);
  }
}
