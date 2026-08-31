import { type Client, createClient } from "@libsql/client";
import { beforeEach, describe, expect, it } from "vitest";
import { SqliteLearningLogRepository } from "../adapters/sqlite/sqlite-learning-log-repository.js";
import { SqliteLearningResourceRepository } from "../adapters/sqlite/sqlite-learning-resource-repository.js";
import { SqliteSkillAreaRepository } from "../adapters/sqlite/sqlite-skill-area-repository.js";

async function createTestClient(): Promise<Client> {
  const client = createClient({ url: ":memory:" });

  await client.execute(`
    CREATE TABLE skill_areas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      weekly_goal_hours REAL NOT NULL DEFAULT 5,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );
  `);
  await client.execute(`
    CREATE TABLE learning_resources (
      id TEXT PRIMARY KEY,
      skill_area_id TEXT NOT NULL REFERENCES skill_areas(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('course', 'book', 'project', 'article')),
      total_units REAL,
      unit TEXT CHECK (unit IN ('chapters', 'videos', 'hours')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );
  `);
  await client.execute(`
    CREATE TABLE learning_logs (
      id TEXT PRIMARY KEY,
      resource_id TEXT NOT NULL REFERENCES learning_resources(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      minutes_spent INTEGER NOT NULL,
      units_completed REAL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );
  `);

  return client;
}

describe("SqliteSkillAreaRepository", () => {
  let client: Client;
  let repo: SqliteSkillAreaRepository;

  beforeEach(async () => {
    client = await createTestClient();
    repo = new SqliteSkillAreaRepository(client);
  });

  it("creates and retrieves a skill area", async () => {
    const area = await repo.create("sa-1", { name: "Programming" });
    expect(area.name).toBe("Programming");
    expect(area.id).toBe("sa-1");

    const found = await repo.getById("sa-1");
    expect(found?.name).toBe("Programming");
  });

  it("lists all skill areas", async () => {
    await repo.create("sa-1", { name: "Programming" });
    await repo.create("sa-2", { name: "Design" });
    await repo.create("sa-3", { name: "Music" });
    expect(await repo.getAll()).toHaveLength(3);
  });

  it("rejects duplicate name on create", async () => {
    await repo.create("sa-1", { name: "Programming" });
    await expect(repo.create("sa-2", { name: "Programming" })).rejects.toThrow();
  });

  it("gets by name", async () => {
    await repo.create("sa-1", { name: "Programming" });
    const found = await repo.getByName("Programming");
    expect(found?.id).toBe("sa-1");
    expect(await repo.getByName("NonExistent")).toBeUndefined();
  });

  it("updates and retrieves", async () => {
    await repo.create("sa-1", { name: "Programming" });
    const updated = await repo.update("sa-1", { name: "Code" });
    expect(updated?.name).toBe("Code");
    expect((await repo.getById("sa-1"))?.name).toBe("Code");
  });

  it("deletes", async () => {
    await repo.create("sa-1", { name: "Programming" });
    expect(await repo.delete("sa-1")).toBe(true);
    expect(await repo.getById("sa-1")).toBeUndefined();
    expect(await repo.getAll()).toHaveLength(0);
  });
});

describe("SqliteLearningResourceRepository", () => {
  let client: Client;
  let repo: SqliteLearningResourceRepository;

  beforeEach(async () => {
    client = await createTestClient();
    await client.execute({
      sql: "INSERT INTO skill_areas (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)",
      args: ["sa-1", "Programming", new Date().toISOString(), new Date().toISOString()],
    });
    repo = new SqliteLearningResourceRepository(client);
  });

  it("creates and retrieves a resource", async () => {
    const resource = await repo.create("lr-1", {
      skillAreaId: "sa-1",
      title: "TypeScript Course",
      type: "course",
    });
    expect(resource.title).toBe("TypeScript Course");
    expect(resource.id).toBe("lr-1");

    const found = await repo.getById("lr-1");
    expect(found?.title).toBe("TypeScript Course");
  });

  it("lists all resources", async () => {
    await repo.create("lr-1", { skillAreaId: "sa-1", title: "Course 1", type: "course" });
    await repo.create("lr-2", { skillAreaId: "sa-1", title: "Book 1", type: "book" });
    expect(await repo.getAll()).toHaveLength(2);
  });

  it("gets by skill area", async () => {
    await repo.create("lr-1", { skillAreaId: "sa-1", title: "TS Course", type: "course" });
    await repo.create("lr-2", { skillAreaId: "sa-1", title: "JS Course", type: "course" });
    const resources = await repo.getBySkillArea("sa-1");
    expect(resources).toHaveLength(2);
    expect(resources.every((r) => r.skillAreaId === "sa-1")).toBe(true);
  });

  it("updates a resource", async () => {
    await repo.create("lr-1", { skillAreaId: "sa-1", title: "Old Title", type: "course" });
    const updated = await repo.update("lr-1", { title: "New Title" });
    expect(updated?.title).toBe("New Title");
    expect((await repo.getById("lr-1"))?.title).toBe("New Title");
  });

  it("deletes", async () => {
    await repo.create("lr-1", { skillAreaId: "sa-1", title: "Course", type: "course" });
    expect(await repo.delete("lr-1")).toBe(true);
    expect(await repo.getById("lr-1")).toBeUndefined();
  });
});

describe("SqliteLearningLogRepository", () => {
  let client: Client;
  let repo: SqliteLearningLogRepository;

  beforeEach(async () => {
    client = await createTestClient();
    await client.execute({
      sql: "INSERT INTO skill_areas (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)",
      args: ["sa-1", "Programming", new Date().toISOString(), new Date().toISOString()],
    });
    await client.execute({
      sql: `INSERT INTO learning_resources (id, skill_area_id, title, type, total_units, unit, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        "lr-1",
        "sa-1",
        "Course",
        "course",
        null,
        null,
        new Date().toISOString(),
        new Date().toISOString(),
      ],
    });
    repo = new SqliteLearningLogRepository(client);
  });

  it("creates and retrieves a log", async () => {
    const log = await repo.create("ll-1", {
      resourceId: "lr-1",
      date: "2025-01-15",
      minutesSpent: 45,
      unitsCompleted: 2,
    });
    expect(log.resourceId).toBe("lr-1");
    expect(log.minutesSpent).toBe(45);
    expect(log.unitsCompleted).toBe(2);

    const found = await repo.getById("ll-1");
    expect(found?.date).toBe("2025-01-15");
  });

  it("gets by resource id", async () => {
    await repo.create("ll-1", { resourceId: "lr-1", date: "2025-01-15", minutesSpent: 30 });
    await repo.create("ll-2", { resourceId: "lr-1", date: "2025-01-16", minutesSpent: 60 });
    await repo.create("ll-3", { resourceId: "lr-1", date: "2025-01-17", minutesSpent: 15 });
    const logs = await repo.getByResourceId("lr-1");
    expect(logs).toHaveLength(3);
  });

  it("gets by date range", async () => {
    await repo.create("ll-1", { resourceId: "lr-1", date: "2025-01-10", minutesSpent: 20 });
    await repo.create("ll-2", { resourceId: "lr-1", date: "2025-01-15", minutesSpent: 40 });
    await repo.create("ll-3", { resourceId: "lr-1", date: "2025-01-20", minutesSpent: 50 });
    const logs = await repo.getByDateRange("2025-01-12", "2025-01-18");
    expect(logs).toHaveLength(1);
    expect(logs[0].date).toBe("2025-01-15");
  });

  it("updates a log", async () => {
    await repo.create("ll-1", { resourceId: "lr-1", date: "2025-01-15", minutesSpent: 30 });
    const updated = await repo.update("ll-1", { minutesSpent: 45, notes: "Extended session" });
    expect(updated?.minutesSpent).toBe(45);
    expect(updated?.notes).toBe("Extended session");
    expect((await repo.getById("ll-1"))?.notes).toBe("Extended session");
  });

  it("deletes", async () => {
    await repo.create("ll-1", { resourceId: "lr-1", date: "2025-01-15", minutesSpent: 30 });
    expect(await repo.delete("ll-1")).toBe(true);
    expect(await repo.getById("ll-1")).toBeUndefined();
  });
});
