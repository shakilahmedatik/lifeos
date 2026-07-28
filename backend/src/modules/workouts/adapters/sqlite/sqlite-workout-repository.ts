import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";

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
  constructor(private readonly db: Database.Database) {}

  getById(id: string): Workout | undefined {
    const row = this.db.prepare("SELECT * FROM workouts WHERE id = ?").get(id) as
      | WorkoutRow
      | undefined;
    return row ? rowToWorkout(row) : undefined;
  }

  getAll(): Workout[] {
    const rows = this.db
      .prepare(`
        SELECT w.*, COUNT(we.id) as exercise_count 
        FROM workouts w 
        LEFT JOIN workout_exercises we ON w.id = we.workout_id 
        GROUP BY w.id 
        ORDER BY w.created_at DESC
      `)
      .all() as WorkoutRow[];
    return rows.map(rowToWorkout);
  }

  getByScheduledDay(day: string): Workout[] {
    const rows = this.db
      .prepare(`
        SELECT w.*, COUNT(we.id) as exercise_count 
        FROM workouts w 
        LEFT JOIN workout_exercises we ON w.id = we.workout_id 
        WHERE w.scheduled_day = ? 
        GROUP BY w.id 
        ORDER BY w.scheduled_time
      `)
      .all(day) as WorkoutRow[];
    return rows.map(rowToWorkout);
  }

  create(id: string, input: NewWorkoutInput): Workout {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO workouts (id, name, description, scheduled_day, scheduled_time, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.name,
        input.description ?? null,
        input.scheduledDay ?? null,
        input.scheduledTime ?? null,
        now,
        now,
      );

    return this.getById(id) as Workout;
  }

  update(id: string, patch: Partial<NewWorkoutInput>): Workout | undefined {
    const existing = this.getById(id);
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

    this.db.prepare(`UPDATE workouts SET ${fields.join(", ")} WHERE id = ?`).run(...values);

    return this.getById(id);
  }

  completeSession(id: string, durationSeconds: number): void {
    this.db
      .prepare(`
      UPDATE workout_sessions
      SET completed_at = ?, duration_seconds = ?
      WHERE id = ?
    `)
      .run(new Date().toISOString(), durationSeconds, id);
  }

  cancelSession(id: string): void {
    this.db.prepare("DELETE FROM workout_sessions WHERE id = ?").run(id);
  }

  reorderExercises(workoutId: string, exerciseIds: string[]): void {
    const updateOrder = this.db.prepare(
      "UPDATE workout_exercises SET order_index = ? WHERE id = ? AND workout_id = ?",
    );
    this.db.transaction(() => {
      for (let i = 0; i < exerciseIds.length; i++) {
        updateOrder.run(i, exerciseIds[i], workoutId);
      }
    })();
  }

  delete(id: string): boolean {
    const result = this.db.prepare("DELETE FROM workouts WHERE id = ?").run(id);
    return result.changes > 0;
  }

  getWithExercises(id: string): WorkoutWithExercises | undefined {
    const workout = this.getById(id);
    if (!workout) return undefined;

    const exerciseRows = this.db
      .prepare("SELECT * FROM workout_exercises WHERE workout_id = ? ORDER BY order_index")
      .all(id) as WorkoutExerciseRow[];

    return {
      ...workout,
      exercises: exerciseRows.map(rowToWorkoutExercise),
    };
  }

  addExercise(
    workoutId: string,
    exerciseId: string,
    input: NewWorkoutExerciseInput,
  ): WorkoutExercise {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO workout_exercises (id, workout_id, exercise_id, sets, reps, reps_per_set, weight, weight_per_set, rest_seconds, order_index, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
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
      );

    return this.getExerciseById(id) as WorkoutExercise;
  }

  updateExercise(id: string, patch: Partial<NewWorkoutExerciseInput>): WorkoutExercise | undefined {
    const existing = this.getExerciseById(id);
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

    this.db
      .prepare(`UPDATE workout_exercises SET ${fields.join(", ")} WHERE id = ?`)
      .run(...values);

    return this.getExerciseById(id);
  }

  removeExercise(id: string): boolean {
    const result = this.db.prepare("DELETE FROM workout_exercises WHERE id = ?").run(id);
    return result.changes > 0;
  }

  getExerciseById(id: string): WorkoutExercise | undefined {
    const row = this.db.prepare("SELECT * FROM workout_exercises WHERE id = ?").get(id) as
      | WorkoutExerciseRow
      | undefined;
    return row ? rowToWorkoutExercise(row) : undefined;
  }

  getExercisesByWorkoutId(workoutId: string): WorkoutExercise[] {
    const rows = this.db
      .prepare("SELECT * FROM workout_exercises WHERE workout_id = ? ORDER BY order_index")
      .all(workoutId) as WorkoutExerciseRow[];
    return rows.map(rowToWorkoutExercise);
  }
}
