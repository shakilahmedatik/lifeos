import { describe, expect, it } from "vitest";

import { durationMinutes, tasksOverlap } from "../domain/rules.js";
import type { Task } from "../domain/types.js";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "1",
    title: "Test task",
    category: "general",
    date: "2026-07-22",
    startTime: "09:00",
    endTime: "10:00",
    status: "planned",
    reminderSilent: false,
    createdAt: "2026-07-22T00:00:00Z",
    updatedAt: "2026-07-22T00:00:00Z",
    ...overrides,
  };
}

describe("durationMinutes", () => {
  it("returns 60 for a 1-hour task", () => {
    expect(durationMinutes(makeTask({ startTime: "09:00", endTime: "10:00" }))).toBe(60);
  });

  it("returns 30 for a 30-minute task", () => {
    expect(durationMinutes(makeTask({ startTime: "14:00", endTime: "14:30" }))).toBe(30);
  });

  it("returns 0 for zero-length task", () => {
    expect(durationMinutes(makeTask({ startTime: "10:00", endTime: "10:00" }))).toBe(0);
  });

  it("handles crossing noon correctly", () => {
    expect(durationMinutes(makeTask({ startTime: "11:30", endTime: "13:15" }))).toBe(105);
  });
});

describe("tasksOverlap", () => {
  it("returns false for tasks on different dates", () => {
    const a = makeTask({ date: "2026-07-22", startTime: "09:00", endTime: "10:00" });
    const b = makeTask({ date: "2026-07-23", startTime: "09:00", endTime: "10:00" });
    expect(tasksOverlap(a, b)).toBe(false);
  });

  it("returns true when task B starts during task A", () => {
    const a = makeTask({ startTime: "09:00", endTime: "11:00" });
    const b = makeTask({ startTime: "10:00", endTime: "12:00" });
    expect(tasksOverlap(a, b)).toBe(true);
  });

  it("returns true when task A starts during task B", () => {
    const a = makeTask({ startTime: "10:00", endTime: "12:00" });
    const b = makeTask({ startTime: "09:00", endTime: "11:00" });
    expect(tasksOverlap(a, b)).toBe(true);
  });

  it("returns true when one task fully contains the other", () => {
    const a = makeTask({ startTime: "09:00", endTime: "17:00" });
    const b = makeTask({ startTime: "10:00", endTime: "11:00" });
    expect(tasksOverlap(a, b)).toBe(true);
  });

  it("returns false for adjacent non-overlapping tasks", () => {
    const a = makeTask({ startTime: "09:00", endTime: "10:00" });
    const b = makeTask({ startTime: "10:00", endTime: "11:00" });
    expect(tasksOverlap(a, b)).toBe(false);
  });

  it("returns false when tasks are far apart", () => {
    const a = makeTask({ startTime: "09:00", endTime: "10:00" });
    const b = makeTask({ startTime: "14:00", endTime: "15:00" });
    expect(tasksOverlap(a, b)).toBe(false);
  });
});
