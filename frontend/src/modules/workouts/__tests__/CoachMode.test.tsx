import type { Exercise, WorkoutWithExercises } from "@lifeos/contracts";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CoachMode } from "../CoachMode.js";

const mockExercises: Exercise[] = [
  {
    id: "ex-1",
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
      sets: 3,
      reps: 10,
      weight: 50,
      restSeconds: 60,
      orderIndex: 0,
      createdAt: "2026-07-22T00:00:00.000Z",
    },
  ],
};

vi.mock("../useWorkouts.js", () => ({
  useExercises: () => ({
    exercises: mockExercises,
    loading: false,
    error: null,
  }),
}));

vi.mock("../useWorkoutTimerSSE.js", () => ({
  useWorkoutTimerSSE: () => ({
    isConnected: true,
    lastAlert: null,
    error: null,
  }),
}));

vi.mock("../notifications/sound-player.js", () => ({
  playNotificationSound: vi.fn(),
}));

vi.mock("../api.js", () => ({
  startSession: vi.fn().mockResolvedValue({ id: "session-1" }),
  completeSession: vi.fn().mockResolvedValue({}),
  addExerciseLog: vi.fn().mockResolvedValue({}),
}));

describe("CoachMode", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders workout name", () => {
    render(<CoachMode workout={mockWorkout} onComplete={() => {}} onExit={() => {}} />);
    expect(screen.getByText("Morning Workout")).toBeDefined();
  });

  it("shows workout description", () => {
    render(<CoachMode workout={mockWorkout} onComplete={() => {}} onExit={() => {}} />);
    expect(screen.getByText("Start your day with energy")).toBeDefined();
  });

  it("shows exercise count", () => {
    render(<CoachMode workout={mockWorkout} onComplete={() => {}} onExit={() => {}} />);
    expect(screen.getByText(/1 exercises/)).toBeDefined();
  });

  it("shows start button", () => {
    render(<CoachMode workout={mockWorkout} onComplete={() => {}} onExit={() => {}} />);
    expect(screen.getByText("Start Workout")).toBeDefined();
  });

  it("shows exit button", () => {
    render(<CoachMode workout={mockWorkout} onComplete={() => {}} onExit={() => {}} />);
    expect(screen.getByText("Exit")).toBeDefined();
  });

  it("calls onExit when exit button is clicked", () => {
    const onExit = vi.fn();
    render(<CoachMode workout={mockWorkout} onComplete={() => {}} onExit={onExit} />);
    screen.getByText("Exit").click();
    expect(onExit).toHaveBeenCalled();
  });
});
