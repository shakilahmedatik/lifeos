import { beforeEach, describe, expect, it } from "vitest";

import { WorkoutSessionService } from "../application/workout-session-service.js";
import type {
  ExerciseLog,
  NewExerciseLogInput,
  WorkoutSession,
  WorkoutSessionWithLogs,
} from "../domain/types.js";
import type { WorkoutSessionRepository } from "../ports/workout-session-repository.js";

function createMockSessionRepo(): WorkoutSessionRepository & {
  sessions: Map<string, WorkoutSession>;
  logs: Map<string, ExerciseLog>;
} {
  const sessions = new Map<string, WorkoutSession>();
  const logs = new Map<string, ExerciseLog>();

  return {
    sessions,
    logs,
    getById(id: string) {
      return sessions.get(id);
    },
    getAll() {
      return Array.from(sessions.values());
    },
    getByWorkoutId(workoutId: string) {
      return Array.from(sessions.values()).filter((s) => s.workoutId === workoutId);
    },
    create(id: string, workoutId: string) {
      const now = new Date().toISOString();
      const session: WorkoutSession = {
        id,
        workoutId,
        startedAt: now,
      };
      sessions.set(id, session);
      return session;
    },
    complete(id: string, durationSeconds: number, notes?: string) {
      const existing = sessions.get(id);
      if (!existing) return undefined;
      const updated: WorkoutSession = {
        ...existing,
        completedAt: new Date().toISOString(),
        durationSeconds,
        notes,
      };
      sessions.set(id, updated);
      return updated;
    },
    delete(id: string) {
      return sessions.delete(id);
    },
    getWithLogs(id: string) {
      const session = sessions.get(id);
      if (!session) return undefined;
      const sessionLogs = Array.from(logs.values()).filter((l) => l.sessionId === id);
      return { ...session, logs: sessionLogs } as WorkoutSessionWithLogs;
    },
    addLog(sessionId: string, input: NewExerciseLogInput) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const log: ExerciseLog = {
        id,
        sessionId,
        exerciseId: input.exerciseId,
        setNumber: input.setNumber,
        actualReps: input.actualReps,
        actualWeight: input.actualWeight,
        completedAt: now,
      };
      logs.set(id, log);
      return log;
    },
    getLogsBySessionId(sessionId: string) {
      return Array.from(logs.values()).filter((l) => l.sessionId === sessionId);
    },
    getRecentSessions(limit: number) {
      return Array.from(sessions.values())
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
        .slice(0, limit);
    },
    getTotalSessions() {
      return sessions.size;
    },
    getTotalDuration() {
      return Array.from(sessions.values()).reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
    },
  };
}

describe("WorkoutSessionService", () => {
  let service: WorkoutSessionService;
  let repo: ReturnType<typeof createMockSessionRepo>;

  beforeEach(() => {
    repo = createMockSessionRepo();
    service = new WorkoutSessionService(repo);
  });

  it("starts a session", () => {
    const session = service.startSession("workout-1");
    expect(session.workoutId).toBe("workout-1");
    expect(session.startedAt).toBeDefined();
    expect(repo.sessions.size).toBe(1);
  });

  it("completes a session", () => {
    const session = service.startSession("workout-1");
    const completed = service.completeSession(session.id, 3600, "Great workout!");
    expect(completed?.completedAt).toBeDefined();
    expect(completed?.durationSeconds).toBe(3600);
    expect(completed?.notes).toBe("Great workout!");
  });

  it("gets a session by id", () => {
    const session = service.startSession("workout-1");
    const found = service.getSession(session.id);
    expect(found?.workoutId).toBe("workout-1");
  });

  it("gets session with logs", () => {
    const session = service.startSession("workout-1");
    service.addExerciseLog(session.id, {
      exerciseId: "ex-1",
      setNumber: 1,
      actualReps: 10,
    });
    const found = service.getSessionWithLogs(session.id);
    expect(found?.logs).toHaveLength(1);
  });

  it("lists all sessions", () => {
    service.startSession("workout-1");
    service.startSession("workout-2");
    expect(service.listSessions()).toHaveLength(2);
  });

  it("gets sessions by workout id", () => {
    service.startSession("workout-1");
    service.startSession("workout-1");
    service.startSession("workout-2");
    const sessions = service.getSessionsByWorkoutId("workout-1");
    expect(sessions).toHaveLength(2);
  });

  it("adds exercise log", () => {
    const session = service.startSession("workout-1");
    const log = service.addExerciseLog(session.id, {
      exerciseId: "ex-1",
      setNumber: 1,
      actualReps: 10,
      actualWeight: 50,
    });
    expect(log.exerciseId).toBe("ex-1");
    expect(log.actualReps).toBe(10);
    expect(log.actualWeight).toBe(50);
  });

  it("gets session logs", () => {
    const session = service.startSession("workout-1");
    service.addExerciseLog(session.id, { exerciseId: "ex-1", setNumber: 1, actualReps: 10 });
    service.addExerciseLog(session.id, { exerciseId: "ex-1", setNumber: 2, actualReps: 8 });
    const logs = service.getSessionLogs(session.id);
    expect(logs).toHaveLength(2);
  });

  it("deletes a session", () => {
    const session = service.startSession("workout-1");
    expect(service.deleteSession(session.id)).toBe(true);
    expect(repo.sessions.size).toBe(0);
  });

  it("gets recent sessions", () => {
    service.startSession("workout-1");
    service.startSession("workout-2");
    service.startSession("workout-3");
    const recent = service.getRecentSessions(2);
    expect(recent).toHaveLength(2);
  });
});
