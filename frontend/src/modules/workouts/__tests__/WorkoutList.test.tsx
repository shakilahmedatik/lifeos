import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Workout } from "../../../../../packages/contracts/src/index.js";
import { WorkoutList } from "../WorkoutList.js";

const mockWorkouts: Workout[] = [
  {
    id: "1",
    name: "Morning Workout",
    description: "Start your day with energy",
    scheduledDay: "monday",
    scheduledTime: "07:00",
    createdAt: "2026-07-22T00:00:00.000Z",
    updatedAt: "2026-07-22T00:00:00.000Z",
  },
  {
    id: "2",
    name: "Evening Workout",
    description: "Wind down with some exercise",
    scheduledDay: "wednesday",
    scheduledTime: "18:00",
    createdAt: "2026-07-22T00:00:00.000Z",
    updatedAt: "2026-07-22T00:00:00.000Z",
  },
];

vi.mock("../useWorkouts.js", () => ({
  useWorkouts: () => ({
    workouts: mockWorkouts,
    loading: false,
    error: null,
    createWorkout: vi.fn(),
    updateWorkout: vi.fn(),
    deleteWorkout: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("WorkoutList", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders workout names", () => {
    render(<WorkoutList />);
    expect(screen.getByText("Morning Workout")).toBeDefined();
    expect(screen.getByText("Evening Workout")).toBeDefined();
  });

  it("shows scheduled day", () => {
    render(<WorkoutList />);
    expect(screen.getByText(/monday/)).toBeDefined();
    expect(screen.getByText(/wednesday/)).toBeDefined();
  });

  it("shows create button", () => {
    render(<WorkoutList />);
    expect(screen.getByText("Create Workout")).toBeDefined();
  });

  it("shows start buttons", () => {
    render(<WorkoutList />);
    const startButtons = screen.getAllByText("Start");
    expect(startButtons).toHaveLength(2);
  });

  it("shows delete buttons", () => {
    render(<WorkoutList />);
    const deleteButtons = screen.getAllByText("Delete");
    expect(deleteButtons).toHaveLength(2);
  });

  it("calls onSelectWorkout when workout is clicked", () => {
    const onSelectWorkout = vi.fn();
    render(<WorkoutList onSelectWorkout={onSelectWorkout} />);
    screen.getByText("Morning Workout").click();
    expect(onSelectWorkout).toHaveBeenCalledWith(mockWorkouts[0]);
  });
});
