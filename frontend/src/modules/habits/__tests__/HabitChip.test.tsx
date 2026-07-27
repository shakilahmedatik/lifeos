// @vitest-environment jsdom
import type { HabitWithStreak } from "@lifeos/contracts";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import HabitChip from "../HabitChip.js";

const mockHabit: HabitWithStreak = {
  id: "1",
  name: "Exercise",
  frequency: "daily",
  targetCount: 1,
  category: "fitness",
  createdAt: "2026-07-22T00:00:00.000Z",
  updatedAt: "2026-07-22T00:00:00.000Z",
  currentStreak: 5,
  longestStreak: 10,
  loggedToday: false,
};

describe("HabitChip", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders habit name", () => {
    render(<HabitChip habit={mockHabit} onToggle={() => {}} />);
    expect(screen.getByText("Exercise")).toBeDefined();
  });

  it("shows streak when > 0", () => {
    render(<HabitChip habit={mockHabit} onToggle={() => {}} />);
    expect(screen.getByText(/🔥 5/)).toBeDefined();
  });

  it("applies logged style when logged", () => {
    const loggedHabit = { ...mockHabit, loggedToday: true };
    render(<HabitChip habit={loggedHabit} onToggle={() => {}} />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-green-100");
  });

  it("calls onToggle when clicked", () => {
    let clicked = false;
    render(
      <HabitChip
        habit={mockHabit}
        onToggle={() => {
          clicked = true;
        }}
      />,
    );
    screen.getByRole("button").click();
    expect(clicked).toBe(true);
  });
});
