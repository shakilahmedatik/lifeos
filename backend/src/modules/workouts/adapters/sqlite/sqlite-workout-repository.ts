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
}

interface WorkoutExerciseRow {
  id: string;
  workout_id: string;
  exercise_id: string;
  sets: number;
  reps: number;
  weight: number | null;
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
      .prepare("SELECT * FROM workouts ORDER BY created_at DESC")
      .all() as WorkoutRow[];
    return rows.map(rowToWorkout);
  }

  getByScheduledDay(day: string): Workout[] {
    const rows = this.db
      .prepare("SELECT * FROM workouts WHERE scheduled_day = ? ORDER BY scheduled_time")
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
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO workout_exercises (id, workout_id, exercise_id, sets, reps, weight, rest_seconds, order_index, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        workoutId,
        exerciseId,
        input.sets ?? 3,
        input.reps ?? 10,
        input.weight ?? null,
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
    if (patch.weight !== undefined) {
      fields.push("weight = ?");
      values.push(patch.weight);
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
