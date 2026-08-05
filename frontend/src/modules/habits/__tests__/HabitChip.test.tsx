// @vitest-environment jsdom
import type { HabitWithStreak } from "@lifeos/contracts";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import HabitChip from "../HabitChip.js";

const mockHabit: HabitWithStreak = {
  id: "1",
  name: "Exercise",
  type: "boolean",
  config: { type: "boolean" },
  category: "fitness",
  archived: false,
  sortOrder: 0,
  createdAt: "2026-07-22T00:00:00.000Z",
  updatedAt: "2026-07-22T00:00:00.000Z",
  currentStreak: 5,
  longestStreak: 10,
  loggedToday: false,
  todayProgress: 0,
  todayValue: 0,
  todayTarget: 1,
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
    const loggedHabit = { ...mockHabit, loggedToday: true, todayProgress: 1 };
    render(<HabitChip habit={loggedHabit} onToggle={() => {}} />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("text-green-400");
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
