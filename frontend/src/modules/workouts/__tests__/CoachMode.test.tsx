// @vitest-environment jsdom
import type { Exercise, WorkoutWithExercises } from "@lifeos/contracts";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CoachMode } from "../CoachMode.js";

const mockExercises: Exercise[] = [
  {
    id: "ex-1",
    name: "Pushups",
    muscleGroup: "chest",
    videoUrl: "https://www.youtube.com/watch?v=example",
    createdAt: "2026-07-22T00:00:00.000Z",
    updatedAt: "2026-07-22T00:00:00.000Z",
  },
  {
    id: "ex-2",
    name: "Bench Press",
    muscleGroup: "chest",
    videoUrl: "https://www.youtube.com/watch?v=example",
    createdAt: "2026-07-22T00:00:00.000Z",
    updatedAt: "2026-07-22T00:00:00.000Z",
  },
];

const mockWorkout: WorkoutWithExercises = {
  id: "1",
  name: "Morning Workout",
  description: "Start your day with energy",
  createdAt: "2026-07-22T00:00:00.000Z",
  updatedAt: "2026-07-22T00:00:00.000Z",
  exercises: [
    {
      id: "we-1",
      workoutId: "1",
      exerciseId: "ex-1",
      sets: 1,
      reps: 10,
      weight: 0,
      restSeconds: 60,
      orderIndex: 0,
      createdAt: "2026-07-22T00:00:00.000Z",
    },
    {
      id: "we-2",
      workoutId: "1",
      exerciseId: "ex-2",
      sets: 3,
      reps: 10,
      weight: 50,
      restSeconds: 60,
      orderIndex: 1,
      createdAt: "2026-07-22T00:00:00.000Z",
    },
  ],
};

vi.mock("../useWorkouts.js", () => ({
  useWorkout: () => ({ workout: mockWorkout, loading: false, error: null }),
  useExercises: () => ({
    exercises: mockExercises,
    loading: false,
    error: null,
  }),
}));

vi.mock("../notifications/sound-player.js", () => ({
  playNotificationSound: vi.fn(),
}));

vi.mock("../api.js", () => ({
  startSession: vi.fn().mockResolvedValue({ id: "session-1" }),
  completeSession: vi.fn().mockResolvedValue({}),
  cancelSession: vi.fn().mockResolvedValue({}),
  addExerciseLog: vi.fn().mockResolvedValue({}),
}));

describe("CoachMode", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders workout name", () => {
    render(<CoachMode workoutId="1" onComplete={() => {}} onExit={() => {}} />);
    expect(screen.getByText("Morning Workout")).toBeDefined();
  });

  it("shows workout description", () => {
    render(<CoachMode workoutId="1" onComplete={() => {}} onExit={() => {}} />);
    expect(screen.getByText("Start your day with energy")).toBeDefined();
  });

  it("shows exercise count", () => {
    render(<CoachMode workoutId="1" onComplete={() => {}} onExit={() => {}} />);
    expect(screen.getAllByText(/2/)[0]).toBeDefined();
  });

  it("shows start button", () => {
    render(<CoachMode workoutId="1" onComplete={() => {}} onExit={() => {}} />);
    expect(screen.getByText("Start Workout")).toBeDefined();
  });

  it("shows exit button", () => {
    render(<CoachMode workoutId="1" onComplete={() => {}} onExit={() => {}} />);
    expect(screen.getByText("Exit")).toBeDefined();
  });

  it("triggers rest timer when starting workout and when transitioning between exercises", async () => {
    render(<CoachMode workoutId="1" onComplete={() => {}} onExit={() => {}} />);

    // Start workout
    fireEvent.click(screen.getByText("Start Workout"));

    // Starts in Rest Period for Pushups (Set 1) so user can take position
    expect(await screen.findByText("Pushups")).toBeDefined();
    expect(screen.getByText("Rest Period")).toBeDefined();

    // Click Skip Rest to start Set 1
    fireEvent.click(screen.getByText("Skip Rest & Start Set"));

    // Click Complete Set 1 for Pushups (Pushups has 1 set)
    fireEvent.click(await screen.findByText("Complete Set 1"));

    // Should transition to Bench Press and show Rest Period
    expect(await screen.findByText("Rest Period")).toBeDefined();
    expect(screen.getByText("Bench Press")).toBeDefined();
    expect(screen.getByText("Resting before Set 1 of 3")).toBeDefined();
  });
});
