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
import { fetchWithAuth } from "../../lib/api.js";

export type { ExerciseProgressPoint };

const API_BASE = "/api/workouts";

// Workout API
export async function fetchWorkouts(): Promise<Workout[]> {
  const res = await fetchWithAuth(API_BASE);
  if (!res.ok) throw new Error("Failed to fetch workouts");
  return res.json();
}

export async function fetchWorkout(id: string): Promise<WorkoutWithExercises> {
  const res = await fetchWithAuth(`${API_BASE}/${id}`);
  if (!res.ok) throw new Error("Failed to fetch workout");
  return res.json();
}

export async function createWorkout(input: NewWorkoutInput): Promise<Workout> {
  const res = await fetchWithAuth(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create workout");
  return res.json();
}

export async function updateWorkout(id: string, patch: Partial<NewWorkoutInput>): Promise<Workout> {
  const res = await fetchWithAuth(`${API_BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to update workout");
  return res.json();
}

export async function deleteWorkout(id: string): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete workout");
}

// Workout Exercise API
export async function addExerciseToWorkout(
  workoutId: string,
  exerciseId: string,
  input: NewWorkoutExerciseInput,
): Promise<WorkoutExercise> {
  const res = await fetchWithAuth(`${API_BASE}/${workoutId}/exercises`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, exerciseId }),
  });
  if (!res.ok) throw new Error("Failed to add exercise to workout");
  return res.json();
}

export async function updateWorkoutExercise(
  workoutId: string,
  exerciseId: string,
  patch: Partial<NewWorkoutExerciseInput>,
): Promise<WorkoutExercise> {
  const res = await fetchWithAuth(`${API_BASE}/${workoutId}/exercises/${exerciseId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to update workout exercise");
  return res.json();
}

export async function removeExerciseFromWorkout(
  workoutId: string,
  exerciseId: string,
): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE}/${workoutId}/exercises/${exerciseId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to remove exercise from workout");
}

export async function reorderWorkoutExercises(
  workoutId: string,
  exerciseIds: string[],
): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE}/${workoutId}/exercises/reorder`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ exerciseIds }),
  });
  if (!res.ok) throw new Error("Failed to reorder exercises");
}

// Exercise Library API
export async function fetchExercises(): Promise<Exercise[]> {
  const res = await fetchWithAuth(`${API_BASE}/exercises`);
  if (!res.ok) throw new Error("Failed to fetch exercises");
  return res.json();
}

export async function fetchExercise(id: string): Promise<Exercise> {
  const res = await fetchWithAuth(`${API_BASE}/exercises/${id}`);
  if (!res.ok) throw new Error("Failed to fetch exercise");
  return res.json();
}

export async function createExercise(input: NewExerciseInput): Promise<Exercise> {
  const res = await fetchWithAuth(`${API_BASE}/exercises`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create exercise");
  return res.json();
}

export async function updateExercise(
  id: string,
  patch: Partial<NewExerciseInput>,
): Promise<Exercise> {
  const res = await fetchWithAuth(`${API_BASE}/exercises/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to update exercise");
  return res.json();
}

export async function deleteExercise(id: string): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE}/exercises/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete exercise");
}

// Session API
export async function fetchSessions(): Promise<WorkoutSession[]> {
  const res = await fetchWithAuth(`${API_BASE}/sessions`);
  if (!res.ok) throw new Error("Failed to fetch sessions");
  return res.json();
}

export async function fetchSession(id: string): Promise<WorkoutSessionWithLogs> {
  const res = await fetchWithAuth(`${API_BASE}/sessions/${id}`);
  if (!res.ok) throw new Error("Failed to fetch session");
  return res.json();
}

export async function startSession(workoutId: string): Promise<WorkoutSession> {
  const res = await fetchWithAuth(`${API_BASE}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workoutId }),
  });
  if (!res.ok) throw new Error("Failed to start session");
  return res.json();
}

export async function completeSession(
  id: string,
  durationSeconds: number,
  notes?: string,
): Promise<WorkoutSession> {
  const res = await fetchWithAuth(`${API_BASE}/sessions/${id}/complete`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ durationSeconds, notes }),
  });
  if (!res.ok) throw new Error("Failed to complete session");
  return res.json();
}

export async function deleteSession(id: string): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE}/sessions/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete session");
}

// Session Logs API
export async function addExerciseLog(
  sessionId: string,
  input: NewExerciseLogInput,
): Promise<ExerciseLog> {
  const res = await fetchWithAuth(`${API_BASE}/sessions/${sessionId}/logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to add exercise log");
  return res.json();
}

export async function fetchSessionLogs(sessionId: string): Promise<ExerciseLog[]> {
  const res = await fetchWithAuth(`${API_BASE}/sessions/${sessionId}/logs`);
  if (!res.ok) throw new Error("Failed to fetch session logs");
  return res.json();
}

// History API
export async function fetchWorkoutHistory(): Promise<WorkoutSession[]> {
  const res = await fetchWithAuth(`${API_BASE}/history`);
  if (!res.ok) throw new Error("Failed to fetch workout history");
  return res.json();
}

export async function fetchWorkoutStats(): Promise<WorkoutStats> {
  const res = await fetchWithAuth(`${API_BASE}/history/stats`);
  if (!res.ok) throw new Error("Failed to fetch workout stats");
  return res.json();
}

export async function fetchRecentSessions(limit = 10): Promise<WorkoutSession[]> {
  const res = await fetchWithAuth(`${API_BASE}/history/recent?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch recent sessions");
  return res.json();
}

export async function fetchExerciseProgress(exerciseId: string): Promise<ExerciseProgressPoint[]> {
  const res = await fetchWithAuth(`${API_BASE}/exercises/${exerciseId}/progress`);
  if (!res.ok) throw new Error("Failed to fetch exercise progress");
  return res.json();
}

export async function cancelSession(sessionId: string) {
  const res = await fetchWithAuth(`${API_BASE}/sessions/${sessionId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to cancel session");
}
