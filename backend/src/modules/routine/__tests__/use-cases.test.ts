import { describe, expect, it } from "vitest";

import { createTask, deleteTask, updateTask } from "../application/use-cases.js";
import type { NewTaskInput, Task } from "../domain/types.js";
import type { TaskRepository } from "../ports/task-repository.js";

class InMemoryTaskRepo implements TaskRepository {
  private tasks: Map<string, Task> = new Map();

  getById(id: string, _userId?: string): Task | undefined {
    return this.tasks.get(id);
  }

  getByDate(date: string, _userId?: string): Task[] {
    return Array.from(this.tasks.values())
      .filter((t) => t.date === date)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  create(id: string, input: NewTaskInput, _userId?: string): Task {
    const task: Task = {
      id,
      title: input.title,
      category: input.category ?? "general",
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      status: "planned",
      notes: input.notes,
      reminderMinutesBefore: input.reminderMinutesBefore,
      reminderSilent: input.reminderSilent ?? false,
      recurrence: input.recurrence ?? "none",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.tasks.set(id, task);
    return task;
  }

  update(id: string, patch: Partial<NewTaskInput>, _userId?: string): Task | undefined {
    const existing = this.tasks.get(id);
    if (!existing) return undefined;
    const updated: Task = {
      ...existing,
      title: patch.title ?? existing.title,
      category: patch.category ?? existing.category,
      date: patch.date ?? existing.date,
      startTime: patch.startTime ?? existing.startTime,
      endTime: patch.endTime ?? existing.endTime,
      notes: patch.notes !== undefined ? patch.notes : existing.notes,
      reminderMinutesBefore:
        patch.reminderMinutesBefore !== undefined
          ? patch.reminderMinutesBefore
          : existing.reminderMinutesBefore,
      reminderSilent:
        patch.reminderSilent !== undefined ? patch.reminderSilent : existing.reminderSilent,
      recurrence: patch.recurrence ?? existing.recurrence,
      updatedAt: new Date().toISOString(),
    };
    this.tasks.set(id, updated);
    return updated;
  }

  updateStatus(id: string, status: Task["status"], _userId?: string): Task | undefined {
    const existing = this.tasks.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, status, updatedAt: new Date().toISOString() };
    this.tasks.set(id, updated);
    return updated;
  }

  delete(id: string, _userId?: string): boolean {
    return this.tasks.delete(id);
  }
}

describe("Routine Use Cases", () => {
  it("createTask validates startTime !== endTime", () => {
    const repo = new InMemoryTaskRepo();
    expect(() =>
      createTask(
        repo,
        {
          title: "Test",
          date: "2026-07-22",
          startTime: "10:00",
          endTime: "10:00",
        },
        "default",
      ),
    ).toThrow("startTime cannot be equal to endTime");
  });

  it("createTask detects overlapping tasks", () => {
    const repo = new InMemoryTaskRepo();
    createTask(
      repo,
      {
        title: "Task 1",
        date: "2026-07-22",
        startTime: "09:00",
        endTime: "11:00",
      },
      "default",
    );

    const res2 = createTask(
      repo,
      {
        title: "Task 2",
        date: "2026-07-22",
        startTime: "10:00",
        endTime: "12:00",
      },
      "default",
    );

    expect(res2.overlapsWith.length).toBe(1);
    expect(res2.overlapsWith[0].title).toBe("Task 1");
  });

  it("updateTask validates merged partial time updates (bug fix test)", () => {
    const repo = new InMemoryTaskRepo();
    const created = createTask(
      repo,
      {
        title: "Task 1",
        date: "2026-07-22",
        startTime: "09:00",
        endTime: "10:00",
      },
      "default",
    );

    // Partial update setting startTime to 10:00 (which equals endTime 10:00) should fail
    expect(() => updateTask(repo, created.task.id, { startTime: "10:00" }, "default")).toThrow(
      "startTime cannot be equal to endTime",
    );
  });

  it("updateTask returns overlap warning on time update", () => {
    const repo = new InMemoryTaskRepo();
    createTask(
      repo,
      {
        title: "Task 1",
        date: "2026-07-22",
        startTime: "09:00",
        endTime: "11:00",
      },
      "default",
    );

    const t2 = createTask(
      repo,
      {
        title: "Task 2",
        date: "2026-07-22",
        startTime: "14:00",
        endTime: "15:00",
      },
      "default",
    );

    const updated = updateTask(repo, t2.task.id, { startTime: "10:00" }, "default");
    expect(updated.overlapsWith.length).toBe(1);
    expect(updated.overlapsWith[0].title).toBe("Task 1");
  });

  it("deleteTask removes task or throws if not found", () => {
    const repo = new InMemoryTaskRepo();
    const t = createTask(
      repo,
      {
        title: "Task 1",
        date: "2026-07-22",
        startTime: "09:00",
        endTime: "10:00",
      },
      "default",
    );

    deleteTask(repo, t.task.id, "default");
    expect(repo.getById(t.task.id)).toBeUndefined();
    expect(() => deleteTask(repo, "non-existent", "default")).toThrow(
      "Task non-existent not found",
    );
  });
});
