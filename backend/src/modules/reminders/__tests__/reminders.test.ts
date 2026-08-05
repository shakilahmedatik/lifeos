import { fileURLToPath } from "node:url";
import type Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";
import { createDatabase } from "../../../shared/db.js";
import { runMigrations } from "../../../shared/migrations/runner.js";
import { SqliteReminderRepository } from "../adapters/sqlite-reminder-repository.js";
import { ReminderService } from "../application/reminder-service.js";

function createTestDb(): Database.Database {
  const db = createDatabase(":memory:");
  runMigrations(db, fileURLToPath(new URL("../../../shared/migrations/", import.meta.url)));
  return db;
}

describe("Reminders Module", () => {
  let db: Database.Database;
  let service: ReminderService;

  beforeEach(() => {
    db = createTestDb();
    const repo = new SqliteReminderRepository(db);
    service = new ReminderService(repo);
  });

  it("should create and retrieve reminders", () => {
    const reminder = service.create(
      {
        title: "Standup Call",
        time: "14:00",
        kind: "event",
      },
      "default",
    );

    expect(reminder.id).toBeDefined();
    expect(reminder.title).toBe("Standup Call");
    expect(reminder.time).toBe("14:00");
    expect(reminder.kind).toBe("event");
    expect(reminder.completed).toBe(false);

    const all = service.getAll("default");
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe("Standup Call");
  });

  it("should update reminder completion status", () => {
    const created = service.create(
      {
        title: "Take vitamins",
        time: "09:00",
        kind: "reminder",
      },
      "default",
    );

    const updated = service.update(created.id, { completed: true }, "default");
    expect(updated?.completed).toBe(true);

    const todayReminders = service.getTodayReminders("2026-08-05", "default");
    expect(todayReminders).toHaveLength(0); // completed item excluded from today's pending
  });

  it("should delete reminder", () => {
    const created = service.create(
      {
        title: "Read book",
        time: "21:00",
      },
      "default",
    );

    const result = service.delete(created.id, "default");
    expect(result).toBe(true);

    const found = service.getById(created.id, "default");
    expect(found).toBeUndefined();
  });
});
