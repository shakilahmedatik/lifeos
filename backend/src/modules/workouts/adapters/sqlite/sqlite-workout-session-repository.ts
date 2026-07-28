import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";

import type {
  ExerciseLog,
  ExerciseProgressPoint,
  NewExerciseLogInput,
  WorkoutSession,
  WorkoutSessionWithLogs,
} from "../../domain/types.js";
import type { WorkoutSessionRepository } from "../../ports/workout-session-repository.js";

interface WorkoutSessionRow {
  id: string;
  workout_id: string;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  notes: string | null;
}

interface ExerciseLogRow {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  actual_reps: number;
  actual_weight: number | null;
  completed_at: string;
}

function rowToWorkoutSession(row: WorkoutSessionRow): WorkoutSession {
  return {
    id: row.id,
    workoutId: row.workout_id,
    startedAt: row.started_at,
    completedAt: row.completed_at ?? undefined,
    durationSeconds: row.duration_seconds ?? undefined,
    notes: row.notes ?? undefined,
  };
}

function rowToExerciseLog(row: ExerciseLogRow): ExerciseLog {
  return {
    id: row.id,
    sessionId: row.session_id,
    exerciseId: row.exercise_id,
    setNumber: row.set_number,
    actualReps: row.actual_reps,
    actualWeight: row.actual_weight ?? undefined,
    completedAt: row.completed_at,
  };
}

export class SqliteWorkoutSessionRepository implements WorkoutSessionRepository {
  constructor(private readonly db: Database.Database) {}

  getById(id: string): WorkoutSession | undefined {
    const row = this.db.prepare("SELECT * FROM workout_sessions WHERE id = ?").get(id) as
      | WorkoutSessionRow
      | undefined;
    return row ? rowToWorkoutSession(row) : undefined;
  }

  getAll(): WorkoutSession[] {
    const rows = this.db
      .prepare("SELECT * FROM workout_sessions ORDER BY started_at DESC")
      .all() as WorkoutSessionRow[];
    return rows.map(rowToWorkoutSession);
  }

  getByWorkoutId(workoutId: string): WorkoutSession[] {
    const rows = this.db
      .prepare("SELECT * FROM workout_sessions WHERE workout_id = ? ORDER BY started_at DESC")
      .all(workoutId) as WorkoutSessionRow[];
    return rows.map(rowToWorkoutSession);
  }

  create(id: string, workoutId: string): WorkoutSession {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO workout_sessions (id, workout_id, started_at)
         VALUES (?, ?, ?)`,
      )
      .run(id, workoutId, now);

    return this.getById(id) as WorkoutSession;
  }

  complete(id: string, durationSeconds: number, notes?: string): WorkoutSession | undefined {
    const existing = this.getById(id);
    if (!existing) return undefined;

    const now = new Date().toISOString();
    this.db
      .prepare(
        "UPDATE workout_sessions SET completed_at = ?, duration_seconds = ?, notes = ? WHERE id = ?",
      )
      .run(now, durationSeconds, notes ?? null, id);

    return this.getById(id);
  }

  delete(id: string): boolean {
    const result = this.db.prepare("DELETE FROM workout_sessions WHERE id = ?").run(id);
    return result.changes > 0;
  }

  getWithLogs(id: string): WorkoutSessionWithLogs | undefined {
    const session = this.getById(id);
    if (!session) return undefined;

    const logRows = this.db
      .prepare("SELECT * FROM exercise_logs WHERE session_id = ? ORDER BY exercise_id, set_number")
      .all(id) as ExerciseLogRow[];

    return {
      ...session,
      logs: logRows.map(rowToExerciseLog),
    };
  }

  addLog(sessionId: string, input: NewExerciseLogInput): ExerciseLog {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO exercise_logs (id, session_id, exercise_id, set_number, actual_reps, actual_weight, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        sessionId,
        input.exerciseId,
        input.setNumber,
        input.actualReps,
        input.actualWeight ?? null,
        now,
      );

    const logRow = this.db.prepare("SELECT * FROM exercise_logs WHERE id = ?").get(id) as
      | ExerciseLogRow
      | undefined;
    if (!logRow) {
      throw new Error("Failed to retrieve created exercise log");
    }
    return rowToExerciseLog(logRow);
  }

  getLogsBySessionId(sessionId: string): ExerciseLog[] {
    const rows = this.db
      .prepare("SELECT * FROM exercise_logs WHERE session_id = ? ORDER BY exercise_id, set_number")
      .all(sessionId) as ExerciseLogRow[];
    return rows.map(rowToExerciseLog);
  }

  getRecentSessions(limit: number): WorkoutSession[] {
    const rows = this.db
      .prepare("SELECT * FROM workout_sessions ORDER BY started_at DESC LIMIT ?")
      .all(limit) as WorkoutSessionRow[];
    return rows.map(rowToWorkoutSession);
  }

  getTotalSessions(): number {
    const result = this.db.prepare("SELECT COUNT(*) as count FROM workout_sessions").get() as {
      count: number;
    };
    return result.count;
  }

  getTotalDuration(): number {
    const result = this.db
      .prepare("SELECT COALESCE(SUM(duration_seconds), 0) as total FROM workout_sessions")
      .get() as { total: number };
    return result.total;
  }

  getExerciseProgress(exerciseId: string): ExerciseProgressPoint[] {
    const rows = this.db
      .prepare(`
      SELECT
        el.session_id,
        ws.started_at as date,
        MAX(el.actual_weight) as max_weight,
        AVG(el.actual_reps) as avg_reps,
        COUNT(*) as total_sets
      FROM exercise_logs el
      JOIN workout_sessions ws ON ws.id = el.session_id
      WHERE el.exercise_id = ? AND ws.completed_at IS NOT NULL
      GROUP BY el.session_id
      ORDER BY ws.started_at ASC
    `)
      .all(exerciseId) as Array<{
      session_id: string;
      date: string;
      max_weight: number | null;
      avg_reps: number;
      total_sets: number;
    }>;

    return rows.map((row) => ({
      sessionId: row.session_id,
      date: row.date,
      maxWeight: row.max_weight ?? 0,
      avgReps: Math.round(row.avg_reps * 10) / 10,
      totalSets: row.total_sets,
    }));
  }
}
