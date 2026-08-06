import type {
  Exercise,
  ExerciseLog,
  ExerciseProgressPoint,
  NewExerciseInput,
  NewExerciseLogInput,
  NewWorkoutExerciseInput,
  NewWorkoutInput,
  Workout,
  WorkoutExercise,
  WorkoutSession,
  WorkoutSessionWithLogs,
  WorkoutStats,
  WorkoutWithExercises,
} from "@lifeos/contracts";
import { request } from "../../lib/api.js";

export type { ExerciseProgressPoint };

const API_BASE = "/api/workouts";

// Workout API
export async function fetchWorkouts(): Promise<Workout[]> {
  return request<Workout[]>(API_BASE);
}

export async function fetchWorkout(id: string): Promise<WorkoutWithExercises> {
  return request<WorkoutWithExercises>(`${API_BASE}/${id}`);
}

export async function createWorkout(input: NewWorkoutInput): Promise<Workout> {
  return request<Workout>(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function updateWorkout(id: string, patch: Partial<NewWorkoutInput>): Promise<Workout> {
  return request<Workout>(`${API_BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function deleteWorkout(id: string): Promise<void> {
  return request<void>(`${API_BASE}/${id}`, { method: "DELETE" });
}

// Workout Exercise API
export async function addExerciseToWorkout(
  workoutId: string,
  exerciseId: string,
  input: NewWorkoutExerciseInput,
): Promise<WorkoutExercise> {
  return request<WorkoutExercise>(`${API_BASE}/${workoutId}/exercises`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, exerciseId }),
  });
}

export async function updateWorkoutExercise(
  workoutId: string,
  exerciseId: string,
  patch: Partial<NewWorkoutExerciseInput>,
): Promise<WorkoutExercise> {
  return request<WorkoutExercise>(`${API_BASE}/${workoutId}/exercises/${exerciseId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function removeExerciseFromWorkout(
  workoutId: string,
  exerciseId: string,
): Promise<void> {
  return request<void>(`${API_BASE}/${workoutId}/exercises/${exerciseId}`, {
    method: "DELETE",
  });
}

export async function reorderWorkoutExercises(
  workoutId: string,
  exerciseIds: string[],
): Promise<void> {
  return request<void>(`${API_BASE}/${workoutId}/exercises/reorder`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ exerciseIds }),
  });
}

// Exercise Library API
export async function fetchExercises(): Promise<Exercise[]> {
  return request<Exercise[]>(`${API_BASE}/exercises`);
}

export async function fetchExercise(id: string): Promise<Exercise> {
  return request<Exercise>(`${API_BASE}/exercises/${id}`);
}

export async function createExercise(input: NewExerciseInput): Promise<Exercise> {
  return request<Exercise>(`${API_BASE}/exercises`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function updateExercise(
  id: string,
  patch: Partial<NewExerciseInput>,
): Promise<Exercise> {
  return request<Exercise>(`${API_BASE}/exercises/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function deleteExercise(id: string): Promise<void> {
  return request<void>(`${API_BASE}/exercises/${id}`, { method: "DELETE" });
}

// Session API
export async function fetchSessions(): Promise<WorkoutSession[]> {
  return request<WorkoutSession[]>(`${API_BASE}/sessions`);
}

export async function fetchSession(id: string): Promise<WorkoutSessionWithLogs> {
  return request<WorkoutSessionWithLogs>(`${API_BASE}/sessions/${id}`);
}

export async function startSession(workoutId: string): Promise<WorkoutSession> {
  return request<WorkoutSession>(`${API_BASE}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workoutId }),
  });
}

export async function completeSession(
  id: string,
  durationSeconds: number,
  notes?: string,
): Promise<WorkoutSession> {
  return request<WorkoutSession>(`${API_BASE}/sessions/${id}/complete`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ durationSeconds, notes }),
  });
}

export async function deleteSession(id: string): Promise<void> {
  return request<void>(`${API_BASE}/sessions/${id}`, { method: "DELETE" });
}

// Session Logs API
export async function addExerciseLog(
  sessionId: string,
  input: NewExerciseLogInput,
): Promise<ExerciseLog> {
  return request<ExerciseLog>(`${API_BASE}/sessions/${sessionId}/logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function fetchSessionLogs(sessionId: string): Promise<ExerciseLog[]> {
  return request<ExerciseLog[]>(`${API_BASE}/sessions/${sessionId}/logs`);
}

// History API
export async function fetchWorkoutHistory(): Promise<WorkoutSession[]> {
  return request<WorkoutSession[]>(`${API_BASE}/history`);
}

export async function fetchWorkoutStats(): Promise<WorkoutStats> {
  return request<WorkoutStats>(`${API_BASE}/history/stats`);
}

export async function fetchRecentSessions(limit = 10): Promise<WorkoutSession[]> {
  return request<WorkoutSession[]>(`${API_BASE}/history/recent?limit=${limit}`);
}

export async function fetchExerciseProgress(exerciseId: string): Promise<ExerciseProgressPoint[]> {
  return request<ExerciseProgressPoint[]>(`${API_BASE}/exercises/${exerciseId}/progress`);
}

export async function cancelSession(sessionId: string): Promise<void> {
  return request<void>(`${API_BASE}/sessions/${sessionId}`, {
    method: "DELETE",
  });
}
