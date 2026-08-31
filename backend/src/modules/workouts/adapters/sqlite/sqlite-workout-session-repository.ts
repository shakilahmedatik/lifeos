import { randomUUID } from "node:crypto";
import type { Client } from "@libsql/client";

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
  constructor(private readonly client: Client) {}

  async getById(id: string, userId = "default"): Promise<WorkoutSession | undefined> {
    const res = await this.client.execute({
      sql: "SELECT * FROM workout_sessions WHERE id = ? AND (user_id = ? OR user_id = '') AND deleted_at IS NULL",
      args: [id, userId],
    });
    const row = res.rows[0] as unknown as WorkoutSessionRow | undefined;
    return row ? rowToWorkoutSession(row) : undefined;
  }

  async getAll(userId = "default"): Promise<WorkoutSession[]> {
    const res = await this.client.execute({
      sql: "SELECT * FROM workout_sessions WHERE (user_id = ? OR user_id = '') AND deleted_at IS NULL ORDER BY started_at DESC",
      args: [userId],
    });
    const rows = res.rows as unknown as WorkoutSessionRow[];
    return rows.map(rowToWorkoutSession);
  }

  async getByWorkoutId(workoutId: string): Promise<WorkoutSession[]> {
    const res = await this.client.execute({
      sql: "SELECT * FROM workout_sessions WHERE workout_id = ? AND deleted_at IS NULL ORDER BY started_at DESC",
      args: [workoutId],
    });
    const rows = res.rows as unknown as WorkoutSessionRow[];
    return rows.map(rowToWorkoutSession);
  }

  async create(id: string, workoutId: string, userId = "default"): Promise<WorkoutSession> {
    const now = new Date().toISOString();
    await this.client.execute({
      sql: `INSERT INTO workout_sessions (id, user_id, workout_id, started_at)
            VALUES (?, ?, ?, ?)`,
      args: [id, userId, workoutId, now],
    });

    return (await this.getById(id, userId)) as WorkoutSession;
  }

  async complete(
    id: string,
    durationSeconds: number,
    notes?: string,
  ): Promise<WorkoutSession | undefined> {
    const existing = await this.getById(id);
    if (!existing) return undefined;

    const now = new Date().toISOString();
    await this.client.execute({
      sql: "UPDATE workout_sessions SET completed_at = ?, duration_seconds = ?, notes = ? WHERE id = ? AND deleted_at IS NULL",
      args: [now, durationSeconds, notes ?? null, id],
    });

    return await this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    const now = new Date().toISOString();
    const res = await this.client.execute({
      sql: "UPDATE workout_sessions SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL",
      args: [now, now, id],
    });
    return res.rowsAffected > 0;
  }

  async getWithLogs(id: string): Promise<WorkoutSessionWithLogs | undefined> {
    const session = await this.getById(id);
    if (!session) return undefined;

    const res = await this.client.execute({
      sql: "SELECT * FROM exercise_logs WHERE session_id = ? AND deleted_at IS NULL ORDER BY exercise_id, set_number",
      args: [id],
    });
    const logRows = res.rows as unknown as ExerciseLogRow[];

    return {
      ...session,
      logs: logRows.map(rowToExerciseLog),
    };
  }

  async addLog(sessionId: string, input: NewExerciseLogInput): Promise<ExerciseLog> {
    const id = randomUUID();
    const now = new Date().toISOString();

    await this.client.execute({
      sql: `INSERT INTO exercise_logs (id, session_id, exercise_id, set_number, actual_reps, actual_weight, completed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        sessionId,
        input.exerciseId,
        input.setNumber,
        input.actualReps,
        input.actualWeight ?? null,
        now,
      ],
    });

    const res = await this.client.execute({
      sql: "SELECT * FROM exercise_logs WHERE id = ? AND deleted_at IS NULL",
      args: [id],
    });
    const logRow = res.rows[0] as unknown as ExerciseLogRow | undefined;
    if (!logRow) {
      throw new Error("Failed to retrieve created exercise log");
    }
    return rowToExerciseLog(logRow);
  }

  async getLogsBySessionId(sessionId: string): Promise<ExerciseLog[]> {
    const res = await this.client.execute({
      sql: "SELECT * FROM exercise_logs WHERE session_id = ? AND deleted_at IS NULL ORDER BY exercise_id, set_number",
      args: [sessionId],
    });
    const rows = res.rows as unknown as ExerciseLogRow[];
    return rows.map(rowToExerciseLog);
  }

  async getRecentSessions(limit: number): Promise<WorkoutSession[]> {
    const res = await this.client.execute({
      sql: "SELECT * FROM workout_sessions WHERE deleted_at IS NULL ORDER BY started_at DESC LIMIT ?",
      args: [limit],
    });
    const rows = res.rows as unknown as WorkoutSessionRow[];
    return rows.map(rowToWorkoutSession);
  }

  async getTotalSessions(): Promise<number> {
    const res = await this.client.execute("SELECT COUNT(*) as count FROM workout_sessions WHERE deleted_at IS NULL");
    return Number(res.rows[0]?.count ?? 0);
  }

  async getTotalDuration(): Promise<number> {
    const res = await this.client.execute(
      "SELECT COALESCE(SUM(duration_seconds), 0) as total FROM workout_sessions WHERE deleted_at IS NULL",
    );
    return Number(res.rows[0]?.total ?? 0);
  }

  async getExerciseProgress(exerciseId: string): Promise<ExerciseProgressPoint[]> {
    const res = await this.client.execute({
      sql: `
        SELECT
          el.session_id,
          ws.started_at as date,
          MAX(el.actual_weight) as max_weight,
          AVG(el.actual_reps) as avg_reps,
          COUNT(*) as total_sets
        FROM exercise_logs el
        JOIN workout_sessions ws ON ws.id = el.session_id
        WHERE el.exercise_id = ? AND ws.completed_at IS NOT NULL AND el.deleted_at IS NULL AND ws.deleted_at IS NULL
        GROUP BY el.session_id
        ORDER BY ws.started_at ASC
      `,
      args: [exerciseId],
    });

    const rows = res.rows as unknown as Array<{
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
