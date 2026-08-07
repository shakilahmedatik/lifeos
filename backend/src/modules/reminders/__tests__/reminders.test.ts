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

  it("should update reminder completion status and toggle back", async () => {
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

    const restored = await service.update(created.id, { completed: false }, "default");
    expect(restored?.completed).toBe(false);

    const todayRemindersAfter = await service.getTodayReminders("2026-08-05", "default");
    expect(todayRemindersAfter).toHaveLength(1);
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

  it("should retrieve reminders by specific date or null date", async () => {
    await service.create({ title: "Daily Workout", time: "07:00", date: null }, "user1");
    await service.create({ title: "Doctor Appointment", time: "11:00", date: "2026-08-10" }, "user1");
    await service.create({ title: "Other Date", time: "12:00", date: "2026-08-15" }, "user1");

    const aug10Reminders = await service.getByDate("2026-08-10", "user1");
    expect(aug10Reminders).toHaveLength(2);
    expect(aug10Reminders.map((r) => r.title)).toContain("Daily Workout");
    expect(aug10Reminders.map((r) => r.title)).toContain("Doctor Appointment");
  });

  it("should sort upcoming reminders properly", async () => {
    await service.create({ title: "Early Morning", time: "01:00", date: null }, "user1");
    await service.create({ title: "Late Night", time: "23:30", date: null }, "user1");

    const upcoming = await service.getUpcomingToday("2026-08-07", "user1", 2);
    expect(upcoming.length).toBeGreaterThan(0);
  });

  it("should isolate user data between different userIds", async () => {
    const r1 = await service.create({ title: "User 1 Item", time: "10:00" }, "user1");
    const r2 = await service.create({ title: "User 2 Item", time: "11:00" }, "user2");

    const user1Items = await service.getAll("user1");
    expect(user1Items).toHaveLength(1);
    expect(user1Items[0].id).toBe(r1.id);

    const user2Update = await service.update(r1.id, { title: "Hacked" }, "user2");
    expect(user2Update).toBeUndefined();

    const user2Delete = await service.delete(r1.id, "user2");
    expect(user2Delete).toBe(false);
  });
});
