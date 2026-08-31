import { randomUUID } from "node:crypto";
import type { Client } from "@libsql/client";

import type {
  NewWorkoutExerciseInput,
  NewWorkoutInput,
  Workout,
  WorkoutExercise,
  WorkoutWithExercises,
} from "../../domain/types.js";
import type { WorkoutRepository } from "../../ports/workout-repository.js";

interface WorkoutRow {
  id: string;
  name: string;
  description: string | null;
  scheduled_day: string | null;
  scheduled_time: string | null;
  created_at: string;
  updated_at: string;
  exercise_count?: number;
}

interface WorkoutExerciseRow {
  id: string;
  workout_id: string;
  exercise_id: string;
  sets: number;
  reps: number;
  weight: number | null;
  weight_per_set?: string | null;
  reps_per_set?: string | null;
  rest_seconds: number;
  order_index: number;
  created_at: string;
}

function rowToWorkout(row: WorkoutRow): Workout {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    scheduledDay: row.scheduled_day as Workout["scheduledDay"],
    scheduledTime: row.scheduled_time ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    exerciseCount: row.exercise_count,
  };
}

function rowToWorkoutExercise(row: WorkoutExerciseRow): WorkoutExercise {
  return {
    id: row.id,
    workoutId: row.workout_id,
    exerciseId: row.exercise_id,
    sets: row.sets,
    reps: row.reps,
    weight: row.weight ?? undefined,
    weights: row.weight_per_set ? JSON.parse(row.weight_per_set) : undefined,
    repsArray: row.reps_per_set ? JSON.parse(row.reps_per_set) : undefined,
    restSeconds: row.rest_seconds,
    orderIndex: row.order_index,
    createdAt: row.created_at,
  };
}

export class SqliteWorkoutRepository implements WorkoutRepository {
  constructor(private readonly client: Client) {}

  async getById(id: string, userId = "default"): Promise<Workout | undefined> {
    const res = await this.client.execute({
      sql: "SELECT * FROM workouts WHERE id = ? AND (user_id = ? OR user_id = '') AND deleted_at IS NULL",
      args: [id, userId],
    });
    const row = res.rows[0] as unknown as WorkoutRow | undefined;
    return row ? rowToWorkout(row) : undefined;
  }

  async getAll(userId = "default"): Promise<Workout[]> {
    const res = await this.client.execute({
      sql: `
        SELECT w.*, COUNT(we.id) as exercise_count 
        FROM workouts w 
        LEFT JOIN workout_exercises we ON w.id = we.workout_id AND we.deleted_at IS NULL
        WHERE (w.user_id = ? OR w.user_id = '') AND w.deleted_at IS NULL
        GROUP BY w.id 
        ORDER BY w.created_at DESC
      `,
      args: [userId],
    });
    const rows = res.rows as unknown as WorkoutRow[];
    return rows.map(rowToWorkout);
  }

  async getByScheduledDay(day: string, userId = "default"): Promise<Workout[]> {
    const res = await this.client.execute({
      sql: `
        SELECT w.*, COUNT(we.id) as exercise_count 
        FROM workouts w 
        LEFT JOIN workout_exercises we ON w.id = we.workout_id AND we.deleted_at IS NULL
        WHERE w.scheduled_day = ? AND (w.user_id = ? OR w.user_id = '') AND w.deleted_at IS NULL
        GROUP BY w.id 
        ORDER BY w.scheduled_time
      `,
      args: [day, userId],
    });
    const rows = res.rows as unknown as WorkoutRow[];
    return rows.map(rowToWorkout);
  }

  async create(id: string, input: NewWorkoutInput, userId = "default"): Promise<Workout> {
    const now = new Date().toISOString();
    await this.client.execute({
      sql: `INSERT INTO workouts (id, user_id, name, description, scheduled_day, scheduled_time, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        userId,
        input.name,
        input.description ?? null,
        input.scheduledDay ?? null,
        input.scheduledTime ?? null,
        now,
        now,
      ],
    });

    return (await this.getById(id, userId)) as Workout;
  }

  async update(id: string, patch: Partial<NewWorkoutInput>): Promise<Workout | undefined> {
    const existing = await this.getById(id);
    if (!existing) return undefined;

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (patch.name !== undefined) {
      fields.push("name = ?");
      values.push(patch.name);
    }
    if (patch.description !== undefined) {
      fields.push("description = ?");
      values.push(patch.description);
    }
    if (patch.scheduledDay !== undefined) {
      fields.push("scheduled_day = ?");
      values.push(patch.scheduledDay);
    }
    if (patch.scheduledTime !== undefined) {
      fields.push("scheduled_time = ?");
      values.push(patch.scheduledTime);
    }

    if (fields.length === 0) return existing;

    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    await this.client.execute({
      sql: `UPDATE workouts SET ${fields.join(", ")} WHERE id = ? AND deleted_at IS NULL`,
      args: values,
    });

    return await this.getById(id);
  }

  async completeSession(id: string, durationSeconds: number): Promise<void> {
    await this.client.execute({
      sql: `UPDATE workout_sessions
            SET completed_at = ?, duration_seconds = ?
            WHERE id = ? AND deleted_at IS NULL`,
      args: [new Date().toISOString(), durationSeconds, id],
    });
  }

  async cancelSession(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.client.execute({
      sql: "UPDATE workout_sessions SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL",
      args: [now, now, id],
    });
  }

  async reorderExercises(workoutId: string, exerciseIds: string[]): Promise<void> {
    const currentRes = await this.client.execute({
      sql: "SELECT id FROM workout_exercises WHERE workout_id = ? AND deleted_at IS NULL",
      args: [workoutId],
    });
    const currentRows = currentRes.rows as unknown as Array<{ id: string }>;
    const currentIds = currentRows.map((row) => row.id);

    const isDuplicateFree = new Set(exerciseIds).size === exerciseIds.length;
    const hasSameLength = exerciseIds.length === currentIds.length;
    const currentSet = new Set(currentIds);
    const hasCompleteMembership = hasSameLength && exerciseIds.every((id) => currentSet.has(id));

    if (!isDuplicateFree || !hasSameLength || !hasCompleteMembership) {
      throw new Error("Invalid exerciseIds payload for reordering");
    }

    const statements = exerciseIds.map((id, i) => ({
      sql: "UPDATE workout_exercises SET order_index = ? WHERE id = ? AND workout_id = ? AND deleted_at IS NULL",
      args: [i, id, workoutId],
    }));

    await this.client.batch(statements, "write");
  }

  async delete(id: string): Promise<boolean> {
    const now = new Date().toISOString();
    const res = await this.client.execute({
      sql: "UPDATE workouts SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL",
      args: [now, now, id],
    });
    return res.rowsAffected > 0;
  }

  async getWithExercises(id: string): Promise<WorkoutWithExercises | undefined> {
    const workout = await this.getById(id);
    if (!workout) return undefined;

    const res = await this.client.execute({
      sql: "SELECT * FROM workout_exercises WHERE workout_id = ? AND deleted_at IS NULL ORDER BY order_index",
      args: [id],
    });
    const exerciseRows = res.rows as unknown as WorkoutExerciseRow[];

    return {
      ...workout,
      exercises: exerciseRows.map(rowToWorkoutExercise),
    };
  }

  async addExercise(
    workoutId: string,
    exerciseId: string,
    input: NewWorkoutExerciseInput,
  ): Promise<WorkoutExercise> {
    const id = randomUUID();
    const now = new Date().toISOString();

    await this.client.execute({
      sql: `INSERT INTO workout_exercises (id, workout_id, exercise_id, sets, reps, reps_per_set, weight, weight_per_set, rest_seconds, order_index, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        workoutId,
        exerciseId,
        input.sets ?? 3,
        input.reps ?? 10,
        input.repsArray ? JSON.stringify(input.repsArray) : null,
        input.weight ?? null,
        input.weights ? JSON.stringify(input.weights) : null,
        input.restSeconds ?? 60,
        input.orderIndex ?? 0,
        now,
      ],
    });

    return (await this.getExerciseById(id)) as WorkoutExercise;
  }

  async updateExercise(
    id: string,
    patch: Partial<NewWorkoutExerciseInput>,
  ): Promise<WorkoutExercise | undefined> {
    const existing = await this.getExerciseById(id);
    if (!existing) return undefined;

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (patch.sets !== undefined) {
      fields.push("sets = ?");
      values.push(patch.sets);
    }
    if (patch.reps !== undefined) {
      fields.push("reps = ?");
      values.push(patch.reps);
    }
    if (patch.repsArray !== undefined) {
      fields.push("reps_per_set = ?");
      values.push(patch.repsArray ? JSON.stringify(patch.repsArray) : null);
    }
    if (patch.weight !== undefined) {
      fields.push("weight = ?");
      values.push(patch.weight);
    }
    if (patch.weights !== undefined) {
      fields.push("weight_per_set = ?");
      values.push(patch.weights ? JSON.stringify(patch.weights) : null);
    }
    if (patch.restSeconds !== undefined) {
      fields.push("rest_seconds = ?");
      values.push(patch.restSeconds);
    }
    if (patch.orderIndex !== undefined) {
      fields.push("order_index = ?");
      values.push(patch.orderIndex);
    }

    if (fields.length === 0) return existing;

    values.push(id);

    await this.client.execute({
      sql: `UPDATE workout_exercises SET ${fields.join(", ")} WHERE id = ? AND deleted_at IS NULL`,
      args: values,
    });

    return await this.getExerciseById(id);
  }

  async removeExercise(id: string): Promise<boolean> {
    const now = new Date().toISOString();
    const res = await this.client.execute({
      sql: "UPDATE workout_exercises SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL",
      args: [now, id],
    });
    return res.rowsAffected > 0;
  }

  async getExerciseById(id: string): Promise<WorkoutExercise | undefined> {
    const res = await this.client.execute({
      sql: "SELECT * FROM workout_exercises WHERE id = ? AND deleted_at IS NULL",
      args: [id],
    });
    const row = res.rows[0] as unknown as WorkoutExerciseRow | undefined;
    return row ? rowToWorkoutExercise(row) : undefined;
  }

  async getExercisesByWorkoutId(workoutId: string): Promise<WorkoutExercise[]> {
    const res = await this.client.execute({
      sql: "SELECT * FROM workout_exercises WHERE workout_id = ? AND deleted_at IS NULL ORDER BY order_index",
      args: [workoutId],
    });
    const rows = res.rows as unknown as WorkoutExerciseRow[];
    return rows.map(rowToWorkoutExercise);
  }
}
