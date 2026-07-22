import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { WorkoutSession, WorkoutStats } from "../../../../../packages/contracts/src/index.js";
import { WorkoutHistory } from "../WorkoutHistory.js";

const mockSessions: WorkoutSession[] = [
  {
    id: "1",
    workoutId: "workout-1",
    startedAt: "2026-07-22T10:00:00.000Z",
    completedAt: "2026-07-22T11:00:00.000Z",
    durationSeconds: 3600,
  },
  {
    id: "2",
    workoutId: "workout-1",
    startedAt: "2026-07-21T10:00:00.000Z",
    completedAt: "2026-07-21T10:45:00.000Z",
    durationSeconds: 2700,
  },
];

const mockStats: WorkoutStats = {
  totalWorkouts: 2,
  totalSessions: 2,
  totalDuration: 6300,
  averageDuration: 3150,
  lastWorkoutDate: "2026-07-22T10:00:00.000Z",
};

vi.mock("../useWorkouts.js", () => ({
  useWorkoutSessions: () => ({
    sessions: mockSessions,
    loading: false,
    error: null,
  }),
  useWorkoutStats: () => ({
    stats: mockStats,
    loading: false,
    error: null,
  }),
}));

describe("WorkoutHistory", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders workout history title", () => {
    render(<WorkoutHistory />);
    expect(screen.getByText("Workout History")).toBeDefined();
  });

  it("shows total workouts", () => {
    render(<WorkoutHistory />);
    const totalWorkouts = screen.getAllByText("2");
    expect(totalWorkouts.length).toBeGreaterThanOrEqual(1);
  });

  it("shows total time", () => {
    render(<WorkoutHistory />);
    expect(screen.getByText(/105 min/)).toBeDefined();
  });

  it("shows average duration", () => {
    render(<WorkoutHistory />);
    expect(screen.getByText(/53 min/)).toBeDefined();
  });

  it("shows recent sessions", () => {
    render(<WorkoutHistory />);
    expect(screen.getByText("Recent Sessions")).toBeDefined();
  });

  it("shows session dates", () => {
    render(<WorkoutHistory />);
    expect(screen.getByText(/7\/22\/2026/)).toBeDefined();
    expect(screen.getByText(/7\/21\/2026/)).toBeDefined();
  });

  it("shows completed status", () => {
    render(<WorkoutHistory />);
    const completedStatuses = screen.getAllByText("Completed");
    expect(completedStatuses).toHaveLength(2);
  });

  it("calls onSelectSession when session is clicked", () => {
    const onSelectSession = vi.fn();
    render(<WorkoutHistory onSelectSession={onSelectSession} />);
    screen.getByText(/7\/22\/2026/).click();
    expect(onSelectSession).toHaveBeenCalledWith("1");
  });
});
