import type { Habit, HabitLog, HabitStats, NewHabitInput, WeeklySummary } from "@lifeos/contracts";

const API_BASE = "/api/habits";

export async function fetchHabits(): Promise<Habit[]> {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error("Failed to fetch habits");
  return res.json();
}

export async function fetchHabit(id: string): Promise<Habit> {
  const res = await fetch(`${API_BASE}/${id}`);
  if (!res.ok) throw new Error("Failed to fetch habit");
  return res.json();
}

export async function createHabit(input: NewHabitInput): Promise<Habit> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create habit");
  return res.json();
}

export async function updateHabit(id: string, patch: Partial<NewHabitInput>): Promise<Habit> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to update habit");
  return res.json();
}

export async function deleteHabit(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete habit");
}

export async function logHabit(habitId: string): Promise<HabitLog> {
  const res = await fetch(`${API_BASE}/${habitId}/log`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to log habit");
  return res.json();
}

export async function unlogHabit(habitId: string, date: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${habitId}/log/${date}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to unlog habit");
}

export async function batchLogHabits(habitIds: string[], date: string): Promise<HabitLog[]> {
  const res = await fetch(`${API_BASE}/log-batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ habitIds, date }),
  });
  if (!res.ok) throw new Error("Failed to batch log habits");
  return res.json();
}

export async function fetchHabitStats(
  habitId: string,
  startDate: string,
  endDate: string,
): Promise<HabitStats> {
  const res = await fetch(`${API_BASE}/${habitId}/stats?startDate=${startDate}&endDate=${endDate}`);
  if (!res.ok) throw new Error("Failed to fetch habit stats");
  return res.json();
}

export async function fetchWeeklySummary(weekStart?: string): Promise<WeeklySummary> {
  const url = weekStart
    ? `${API_BASE}/weekly-review?weekStart=${weekStart}`
    : `${API_BASE}/weekly-review`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch weekly summary");
  return res.json();
}
