import { fileURLToPath } from "node:url";
import { type Client, createClient } from "@libsql/client";
import { beforeEach, describe, expect, it } from "vitest";
import { runMigrations } from "../../../shared/migrations/runner.js";
import { SqliteReminderRepository } from "../adapters/sqlite-reminder-repository.js";
import { ReminderService } from "../application/reminder-service.js";

async function createTestClient(): Promise<Client> {
  const client = createClient({ url: ":memory:" });
  await runMigrations(
    client,
    fileURLToPath(new URL("../../../shared/migrations/", import.meta.url)),
  );
  return client;
}

describe("Reminders Module", () => {
  let client: Client;
  let service: ReminderService;

  beforeEach(async () => {
    client = await createTestClient();
    const repo = new SqliteReminderRepository(client);
    service = new ReminderService(repo);
  });

  it("should create and retrieve reminders", async () => {
    const reminder = await service.create(
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

    const all = await service.getAll("default");
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe("Standup Call");
  });

  it("should update reminder completion status", async () => {
    const created = await service.create(
      {
        title: "Take vitamins",
        time: "09:00",
        kind: "reminder",
      },
      "default",
    );

    const updated = await service.update(created.id, { completed: true }, "default");
    expect(updated?.completed).toBe(true);

    const todayReminders = await service.getTodayReminders("2026-08-05", "default");
    expect(todayReminders).toHaveLength(0); // completed item excluded from today's pending
  });

  it("should delete reminder", async () => {
    const created = await service.create(
      {
        title: "Read book",
        time: "21:00",
      },
      "default",
    );

    const result = await service.delete(created.id, "default");
    expect(result).toBe(true);

    const found = await service.getById(created.id, "default");
    expect(found).toBeUndefined();
  });
});
