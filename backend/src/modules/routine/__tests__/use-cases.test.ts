import { describe, expect, it } from "vitest";

import {
  createTask,
  deleteTask,
  getRoutineStats,
  getTaskHistory,
  updateTask,
} from "../application/use-cases.js";
import type { NewTaskInput, Task } from "../domain/types.js";
import type { TaskRepository } from "../ports/task-repository.js";

class InMemoryTaskRepo implements TaskRepository {
  private tasks: Map<string, Task> = new Map();

  async getById(id: string, _userId?: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getByDate(date: string, _userId?: string): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter((t) => t.date === date)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  async getByDateRange(startDate: string, endDate: string, _userId?: string): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter((t) => t.date >= startDate && t.date <= endDate)
      .sort((a, b) => b.date.localeCompare(a.date) || a.startTime.localeCompare(b.startTime));
  }

  async getAll(_userId?: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).sort(
      (a, b) => b.date.localeCompare(a.date) || a.startTime.localeCompare(b.startTime),
    );
  }

  async create(id: string, input: NewTaskInput, _userId?: string): Promise<Task> {
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

  async update(
    id: string,
    patch: Partial<NewTaskInput>,
    _userId?: string,
  ): Promise<Task | undefined> {
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

  async updateStatus(
    id: string,
    status: Task["status"],
    _userId?: string,
  ): Promise<Task | undefined> {
    const existing = this.tasks.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, status, updatedAt: new Date().toISOString() };
    this.tasks.set(id, updated);
    return updated;
  }

  async delete(id: string, _userId?: string): Promise<boolean> {
    return this.tasks.delete(id);
  }
}

describe("Routine Use Cases", () => {
  it("createTask validates startTime !== endTime", async () => {
    const repo = new InMemoryTaskRepo();
    await expect(
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
    ).rejects.toThrow("startTime cannot be equal to endTime");
  });

  it("createTask detects overlapping tasks", async () => {
    const repo = new InMemoryTaskRepo();
    await createTask(
      repo,
      {
        title: "Task 1",
        date: "2026-07-22",
        startTime: "09:00",
        endTime: "11:00",
      },
      "default",
    );

    const res2 = await createTask(
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

  it("updateTask validates merged partial time updates (bug fix test)", async () => {
    const repo = new InMemoryTaskRepo();
    const created = await createTask(
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
    await expect(
      updateTask(repo, created.task.id, { startTime: "10:00" }, "default"),
    ).rejects.toThrow("startTime cannot be equal to endTime");
  });

  it("updateTask returns overlap warning on time update", async () => {
    const repo = new InMemoryTaskRepo();
    await createTask(
      repo,
      {
        title: "Task 1",
        date: "2026-07-22",
        startTime: "09:00",
        endTime: "11:00",
      },
      "default",
    );

    const t2 = await createTask(
      repo,
      {
        title: "Task 2",
        date: "2026-07-22",
        startTime: "14:00",
        endTime: "15:00",
      },
      "default",
    );

    const updated = await updateTask(repo, t2.task.id, { startTime: "10:00" }, "default");
    expect(updated.overlapsWith.length).toBe(1);
    expect(updated.overlapsWith[0].title).toBe("Task 1");
  });

  it("deleteTask removes task or throws if not found", async () => {
    const repo = new InMemoryTaskRepo();
    const t = await createTask(
      repo,
      {
        title: "Task 1",
        date: "2026-07-22",
        startTime: "09:00",
        endTime: "10:00",
      },
      "default",
    );

    await deleteTask(repo, t.task.id, "default");
    expect(await repo.getById(t.task.id)).toBeUndefined();
    await expect(deleteTask(repo, "non-existent", "default")).rejects.toThrow(
      "Task non-existent not found",
    );
  });

  it("getTaskHistory filters tasks by category, status, and search query", async () => {
    const repo = new InMemoryTaskRepo();
    await createTask(
      repo,
      {
        title: "Morning Workout",
        category: "workout",
        date: "2026-08-01",
        startTime: "07:00",
        endTime: "08:00",
      },
      "default",
    );
    await createTask(
      repo,
      {
        title: "Coding Session",
        category: "work",
        date: "2026-08-02",
        startTime: "09:00",
        endTime: "12:00",
      },
      "default",
    );

    const all = await getTaskHistory(repo, {}, "default");
    expect(all.length).toBe(2);

    const filteredCategory = await getTaskHistory(repo, { category: "workout" }, "default");
    expect(filteredCategory.length).toBe(1);
    expect(filteredCategory[0].title).toBe("Morning Workout");

    const filteredSearch = await getTaskHistory(repo, { search: "Coding" }, "default");
    expect(filteredSearch.length).toBe(1);
    expect(filteredSearch[0].title).toBe("Coding Session");
  });

  it("getRoutineStats returns aggregated metrics and category distribution", async () => {
    const repo = new InMemoryTaskRepo();
    const t1 = await createTask(
      repo,
      {
        title: "Task 1",
        category: "work",
        date: "2026-08-01",
        startTime: "09:00",
        endTime: "10:00",
      },
      "default",
    );
    await repo.updateStatus(t1.task.id, "done", "default");

    await createTask(
      repo,
      {
        title: "Task 2",
        category: "personal",
        date: "2026-08-01",
        startTime: "11:00",
        endTime: "12:00",
      },
      "default",
    );

    const stats = await getRoutineStats(repo, "default");
    expect(stats.totalTasks).toBe(2);
    expect(stats.completedTasks).toBe(1);
    expect(stats.completionRate).toBe(50);
    expect(stats.categoryDistribution.length).toBe(2);
  });
});
