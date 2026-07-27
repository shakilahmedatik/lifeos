import { describe, expect, it } from "vitest";

import { durationMinutes, isOvernightTask, tasksOverlap } from "../domain/rules.js";
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

describe("isOvernightTask", () => {
  it("returns true when start time is greater than end time", () => {
    expect(isOvernightTask("23:00", "02:00")).toBe(true);
  });

  it("returns false when start time is less than end time", () => {
    expect(isOvernightTask("09:00", "17:00")).toBe(false);
  });
});

describe("durationMinutes", () => {
  it("returns 60 for a 1-hour task", () => {
    expect(durationMinutes(makeTask({ startTime: "09:00", endTime: "10:00" }))).toBe(60);
  });

  it("returns 30 for a 30-minute task", () => {
    expect(durationMinutes(makeTask({ startTime: "14:00", endTime: "14:30" }))).toBe(30);
  });

  it("handles crossing noon correctly", () => {
    expect(durationMinutes(makeTask({ startTime: "11:30", endTime: "13:15" }))).toBe(105);
  });

  it("calculates overnight duration correctly", () => {
    // 23:00 to 02:00 -> 3 hours = 180 minutes
    expect(durationMinutes(makeTask({ startTime: "23:00", endTime: "02:00" }))).toBe(180);
  });
});

describe("tasksOverlap", () => {
  it("returns false for non-overnight tasks on different dates", () => {
    const a = makeTask({ date: "2026-07-22", startTime: "09:00", endTime: "10:00" });
    const b = makeTask({ date: "2026-07-23", startTime: "09:00", endTime: "10:00" });
    expect(tasksOverlap(a, b)).toBe(false);
  });

  it("returns true when task B starts during task A", () => {
    const a = makeTask({ startTime: "09:00", endTime: "11:00" });
    const b = makeTask({ startTime: "10:00", endTime: "12:00" });
    expect(tasksOverlap(a, b)).toBe(true);
  });

  it("returns true for overnight task cross-date overlap", () => {
    const overnightA = makeTask({ date: "2026-07-22", startTime: "23:00", endTime: "02:00" });
    const morningB = makeTask({ date: "2026-07-23", startTime: "01:00", endTime: "03:00" });
    expect(tasksOverlap(overnightA, morningB)).toBe(true);
  });

  it("returns false for adjacent non-overlapping tasks", () => {
    const a = makeTask({ startTime: "09:00", endTime: "10:00" });
    const b = makeTask({ startTime: "10:00", endTime: "11:00" });
    expect(tasksOverlap(a, b)).toBe(false);
  });
});
