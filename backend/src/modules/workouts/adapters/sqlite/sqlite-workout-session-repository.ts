import { randomUUID } from "node:crypto";
import { and, asc, avg, count, desc, eq, isNotNull, isNull, max, or, sql } from "drizzle-orm";

import type { DrizzleClient } from "../../../../shared/db.js";
import { exerciseLogs, workoutSessions } from "../../../../shared/schema.js";
import type {
  ExerciseLog,
  ExerciseProgressPoint,
  NewExerciseLogInput,
  WorkoutSession,
  WorkoutSessionWithLogs,
} from "../../domain/types.js";
import type { WorkoutSessionRepository } from "../../ports/workout-session-repository.js";

function rowToWorkoutSession(row: typeof workoutSessions.$inferSelect): WorkoutSession {
  return {
    id: row.id,
    workoutId: row.workoutId,
    startedAt: row.startedAt,
    completedAt: row.completedAt ?? undefined,
    durationSeconds: row.durationSeconds ?? undefined,
    notes: row.notes ?? undefined,
  };
}

function rowToExerciseLog(row: typeof exerciseLogs.$inferSelect): ExerciseLog {
  return {
    id: row.id,
    sessionId: row.sessionId,
    exerciseId: row.exerciseId,
    setNumber: row.setNumber,
    actualReps: row.actualReps,
    actualWeight: row.actualWeight ?? undefined,
    completedAt: row.completedAt,
  };
}

function userScope(userId: string) {
  return and(
    or(eq(workoutSessions.userId, userId), eq(workoutSessions.userId, "")),
    isNull(workoutSessions.deletedAt),
  );
}

export class DrizzleWorkoutSessionRepository implements WorkoutSessionRepository {
  constructor(private readonly db: DrizzleClient) {}

  async getById(id: string, userId = "default"): Promise<WorkoutSession | undefined> {
    const [row] = await this.db
      .select()
      .from(workoutSessions)
      .where(and(eq(workoutSessions.id, id), userScope(userId)));
    return row ? rowToWorkoutSession(row) : undefined;
  }

  async getAll(userId = "default"): Promise<WorkoutSession[]> {
    const rows = await this.db
      .select()
      .from(workoutSessions)
      .where(userScope(userId))
      .orderBy(desc(workoutSessions.startedAt));
    return rows.map(rowToWorkoutSession);
  }

  async getByWorkoutId(workoutId: string, userId = "default"): Promise<WorkoutSession[]> {
    const rows = await this.db
      .select()
      .from(workoutSessions)
      .where(and(eq(workoutSessions.workoutId, workoutId), userScope(userId)))
      .orderBy(desc(workoutSessions.startedAt));
    return rows.map(rowToWorkoutSession);
  }

  async create(id: string, workoutId: string, userId = "default"): Promise<WorkoutSession> {
    const now = new Date().toISOString();
    await this.db.insert(workoutSessions).values({
      id,
      userId,
      workoutId,
      startedAt: now,
      createdAt: now,
    });

    return (await this.getById(id, userId)) as WorkoutSession;
  }

  async complete(
    id: string,
    durationSeconds: number,
    userId = "default",
    notes?: string,
  ): Promise<WorkoutSession | undefined> {
    const existing = await this.getById(id, userId);
    if (!existing) return undefined;

    const now = new Date().toISOString();
    await this.db
      .update(workoutSessions)
      .set({ completedAt: now, durationSeconds, notes: notes ?? null })
      .where(and(eq(workoutSessions.id, id), userScope(userId)));

    return await this.getById(id, userId);
  }

  async delete(id: string, userId = "default"): Promise<boolean> {
    const now = new Date().toISOString();
    const result = await this.db
      .update(workoutSessions)
      .set({ deletedAt: now })
      .where(and(eq(workoutSessions.id, id), userScope(userId)));
    return result.rowsAffected > 0;
  }

  async getWithLogs(id: string, userId = "default"): Promise<WorkoutSessionWithLogs | undefined> {
    const session = await this.getById(id, userId);
    if (!session) return undefined;

    const logRows = await this.db
      .select()
      .from(exerciseLogs)
      .where(and(eq(exerciseLogs.sessionId, id), isNull(exerciseLogs.deletedAt)))
      .orderBy(asc(exerciseLogs.exerciseId), asc(exerciseLogs.setNumber));

    return {
      ...session,
      logs: logRows.map(rowToExerciseLog),
    };
  }

  async addLog(
    sessionId: string,
    input: NewExerciseLogInput,
    _userId = "default",
  ): Promise<ExerciseLog> {
    const id = randomUUID();
    const now = new Date().toISOString();

    await this.db.insert(exerciseLogs).values({
      id,
      sessionId,
      exerciseId: input.exerciseId,
      setNumber: input.setNumber,
      actualReps: input.actualReps,
      actualWeight: input.actualWeight ?? null,
      completedAt: now,
    });

    const [logRow] = await this.db
      .select()
      .from(exerciseLogs)
      .where(and(eq(exerciseLogs.id, id), isNull(exerciseLogs.deletedAt)));

    if (!logRow) {
      throw new Error("Failed to retrieve created exercise log");
    }
    return rowToExerciseLog(logRow);
  }

  async getLogsBySessionId(sessionId: string, _userId = "default"): Promise<ExerciseLog[]> {
    const rows = await this.db
      .select()
      .from(exerciseLogs)
      .where(and(eq(exerciseLogs.sessionId, sessionId), isNull(exerciseLogs.deletedAt)))
      .orderBy(asc(exerciseLogs.exerciseId), asc(exerciseLogs.setNumber));
    return rows.map(rowToExerciseLog);
  }

  async getRecentSessions(limit: number, userId = "default"): Promise<WorkoutSession[]> {
    const rows = await this.db
      .select()
      .from(workoutSessions)
      .where(userScope(userId))
      .orderBy(desc(workoutSessions.startedAt))
      .limit(limit);
    return rows.map(rowToWorkoutSession);
  }

  async getTotalSessions(userId = "default"): Promise<number> {
    const [result] = await this.db
      .select({ count: count() })
      .from(workoutSessions)
      .where(userScope(userId));
    return result?.count ?? 0;
  }

  async getTotalDuration(userId = "default"): Promise<number> {
    const [result] = await this.db
      .select({ total: sql<number>`COALESCE(SUM(${workoutSessions.durationSeconds}), 0)` })
      .from(workoutSessions)
      .where(userScope(userId));
    return Number(result?.total ?? 0);
  }

  async getExerciseProgress(
    exerciseId: string,
    userId = "default",
  ): Promise<ExerciseProgressPoint[]> {
    const rows = await this.db
      .select({
        sessionId: exerciseLogs.sessionId,
        date: workoutSessions.startedAt,
        maxWeight: max(exerciseLogs.actualWeight),
        avgReps: avg(exerciseLogs.actualReps),
        totalSets: count(),
      })
      .from(exerciseLogs)
      .innerJoin(workoutSessions, eq(workoutSessions.id, exerciseLogs.sessionId))
      .where(
        and(
          eq(exerciseLogs.exerciseId, exerciseId),
          or(eq(workoutSessions.userId, userId), eq(workoutSessions.userId, "")),
          isNotNull(workoutSessions.completedAt),
          isNull(exerciseLogs.deletedAt),
          isNull(workoutSessions.deletedAt),
        ),
      )
      .groupBy(exerciseLogs.sessionId)
      .orderBy(asc(workoutSessions.startedAt));

    return rows.map((row) => ({
      sessionId: row.sessionId,
      date: row.date,
      maxWeight: Number(row.maxWeight ?? 0),
      avgReps: Math.round(Number(row.avgReps ?? 0) * 10) / 10,
      totalSets: row.totalSets,
    }));
  }
}
