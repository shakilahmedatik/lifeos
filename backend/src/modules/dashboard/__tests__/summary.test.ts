import { describe, expect, it } from "vitest";
import type { Task } from "../../routine/domain/types.js";
import { getTaskScheduleStack } from "../application/summary.js";

function makeTask(id: string, startTime: string, endTime: string, isOvernight = false): Task {
  return {
    id,
    title: `Task ${id}`,
    category: "work",
    date: "2026-08-07",
    startTime,
    endTime,
    status: "planned",
    reminderSilent: false,
    isOvernight,
    createdAt: "2026-08-07T00:00:00Z",
    updatedAt: "2026-08-07T00:00:00Z",
  };
}

describe("getTaskScheduleStack", () => {
  it("extracts correct previous, now, and next tasks at 09:30 AM", () => {
    const tasks: Task[] = [
      makeTask("1", "08:00", "09:00"),
      makeTask("2", "09:00", "10:00"),
      makeTask("3", "10:00", "11:00"),
    ];

    const result = getTaskScheduleStack(tasks, "2026-08-07T09:30:00+06:00");
    expect(result.previous?.id).toBe("1");
    expect(result.now?.id).toBe("2");
    expect(result.next?.id).toBe("3");
  });

  it("handles ISO string timezone parsing independently of process environment", () => {
    const tasks: Task[] = [
      makeTask("1", "08:00", "09:00"),
      makeTask("2", "09:00", "10:00"),
      makeTask("3", "10:00", "11:00"),
    ];

    // Even if server executes in UTC, 09:30 in ISO should evaluate at 09:30 local schedule time
    const result = getTaskScheduleStack(tasks, "2026-08-07T09:30:00Z");
    expect(result.now?.id).toBe("2");
    expect(result.next?.id).toBe("3");
  });

  it("handles empty next task when current time is past all tasks for today", () => {
    const tasks: Task[] = [makeTask("1", "08:00", "09:00"), makeTask("2", "09:00", "10:00")];

    const result = getTaskScheduleStack(tasks, "2026-08-07T21:00:00+06:00");
    expect(result.previous?.id).toBe("2");
    expect(result.now).toBeNull();
    expect(result.next).toBeNull();
  });

  it("correctly identifies overnight tasks active across midnight", () => {
    const tasks: Task[] = [
      makeTask("overnight", "23:00", "02:00", true),
      makeTask("morning", "08:00", "09:00"),
    ];

    const result1 = getTaskScheduleStack(tasks, "2026-08-07T23:30:00+06:00");
    expect(result1.now?.id).toBe("overnight");

    const result2 = getTaskScheduleStack(tasks, "2026-08-07T01:30:00+06:00");
    expect(result2.now?.id).toBe("overnight");
    expect(result2.next?.id).toBe("morning");
  });
});
