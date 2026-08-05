import Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";
import { SqliteLearningLogRepository } from "../adapters/sqlite/sqlite-learning-log-repository.js";
import { SqliteLearningResourceRepository } from "../adapters/sqlite/sqlite-learning-resource-repository.js";
import { SqliteSkillAreaRepository } from "../adapters/sqlite/sqlite-skill-area-repository.js";

function createTestDb(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE skill_areas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      weekly_goal_hours REAL NOT NULL DEFAULT 5,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE learning_resources (
      id TEXT PRIMARY KEY,
      skill_area_id TEXT NOT NULL REFERENCES skill_areas(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('course', 'book', 'project', 'article')),
      total_units REAL,
      unit TEXT CHECK (unit IN ('chapters', 'videos', 'hours')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE learning_logs (
      id TEXT PRIMARY KEY,
      resource_id TEXT NOT NULL REFERENCES learning_resources(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      minutes_spent INTEGER NOT NULL,
      units_completed REAL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX idx_learning_resources_skill_area ON learning_resources(skill_area_id);
    CREATE INDEX idx_learning_logs_resource_date ON learning_logs(resource_id, date);
  `);

  return db;
}

describe("SqliteSkillAreaRepository", () => {
  let db: Database.Database;
  let repo: SqliteSkillAreaRepository;

  beforeEach(() => {
    db = createTestDb();
    repo = new SqliteSkillAreaRepository(db);
  });

  it("creates and retrieves a skill area", () => {
    const area = repo.create("sa-1", { name: "Programming" });
    expect(area.name).toBe("Programming");
    expect(area.id).toBe("sa-1");

    const found = repo.getById("sa-1");
    expect(found?.name).toBe("Programming");
  });

  it("lists all skill areas", () => {
    repo.create("sa-1", { name: "Programming" });
    repo.create("sa-2", { name: "Design" });
    repo.create("sa-3", { name: "Music" });
    expect(repo.getAll()).toHaveLength(3);
  });

  it("rejects duplicate name on create", () => {
    repo.create("sa-1", { name: "Programming" });
    expect(() => repo.create("sa-2", { name: "Programming" })).toThrow();
  });

  it("gets by name", () => {
    repo.create("sa-1", { name: "Programming" });
    const found = repo.getByName("Programming");
    expect(found?.id).toBe("sa-1");
    expect(repo.getByName("NonExistent")).toBeUndefined();
  });

  it("updates and retrieves", () => {
    repo.create("sa-1", { name: "Programming" });
    const updated = repo.update("sa-1", { name: "Code" });
    expect(updated?.name).toBe("Code");
    expect(repo.getById("sa-1")?.name).toBe("Code");
  });

  it("deletes", () => {
    repo.create("sa-1", { name: "Programming" });
    expect(repo.delete("sa-1")).toBe(true);
    expect(repo.getById("sa-1")).toBeUndefined();
    expect(repo.getAll()).toHaveLength(0);
  });
});

describe("SqliteLearningResourceRepository", () => {
  let db: Database.Database;
  let repo: SqliteLearningResourceRepository;

  beforeEach(() => {
    db = createTestDb();
    // Pre-create a skill area needed for foreign key
    const skillAreaRepo = new (class {
      constructor(private db: Database.Database) {}
      create(id: string, name: string) {
        this.db
          .prepare("INSERT INTO skill_areas (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)")
          .run(id, name, new Date().toISOString(), new Date().toISOString());
        return id;
      }
    })(db);
    skillAreaRepo.create("sa-1", "Programming");
    repo = new SqliteLearningResourceRepository(db);
  });

  it("creates and retrieves a resource", () => {
    const resource = repo.create("lr-1", {
      skillAreaId: "sa-1",
      title: "TypeScript Course",
      type: "course",
    });
    expect(resource.title).toBe("TypeScript Course");
    expect(resource.id).toBe("lr-1");

    const found = repo.getById("lr-1");
    expect(found?.title).toBe("TypeScript Course");
  });

  it("lists all resources", () => {
    repo.create("lr-1", { skillAreaId: "sa-1", title: "Course 1", type: "course" });
    repo.create("lr-2", { skillAreaId: "sa-1", title: "Book 1", type: "book" });
    expect(repo.getAll()).toHaveLength(2);
  });

  it("gets by skill area", () => {
    repo.create("lr-1", { skillAreaId: "sa-1", title: "TS Course", type: "course" });
    repo.create("lr-2", { skillAreaId: "sa-1", title: "JS Course", type: "course" });
    const resources = repo.getBySkillArea("sa-1");
    expect(resources).toHaveLength(2);
    expect(resources.every((r) => r.skillAreaId === "sa-1")).toBe(true);
  });

  it("updates a resource", () => {
    repo.create("lr-1", { skillAreaId: "sa-1", title: "Old Title", type: "course" });
    const updated = repo.update("lr-1", { title: "New Title" });
    expect(updated?.title).toBe("New Title");
    expect(repo.getById("lr-1")?.title).toBe("New Title");
  });

  it("deletes", () => {
    repo.create("lr-1", { skillAreaId: "sa-1", title: "Course", type: "course" });
    expect(repo.delete("lr-1")).toBe(true);
    expect(repo.getById("lr-1")).toBeUndefined();
  });
});

describe("SqliteLearningLogRepository", () => {
  let db: Database.Database;
  let repo: SqliteLearningLogRepository;

  beforeEach(() => {
    db = createTestDb();
    // Pre-create skill area and resource needed for foreign keys
    const skillAreaRepo = new (class {
      constructor(private db: Database.Database) {}
      create(id: string, name: string) {
        this.db
          .prepare("INSERT INTO skill_areas (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)")
          .run(id, name, new Date().toISOString(), new Date().toISOString());
      }
    })(db);
    skillAreaRepo.create("sa-1", "Programming");

    const resourceRepo = new (class {
      constructor(private db: Database.Database) {}
      create(id: string, skillAreaId: string, title: string, type: string) {
        this.db
          .prepare(
            `INSERT INTO learning_resources (id, skill_area_id, title, type, total_units, unit, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            id,
            skillAreaId,
            title,
            type,
            null,
            null,
            new Date().toISOString(),
            new Date().toISOString(),
          );
      }
    })(db);
    resourceRepo.create("lr-1", "sa-1", "Course", "course");
    repo = new SqliteLearningLogRepository(db);
  });

  it("creates and retrieves a log", () => {
    const log = repo.create("ll-1", {
      resourceId: "lr-1",
      date: "2025-01-15",
      minutesSpent: 45,
      unitsCompleted: 2,
    });
    expect(log.resourceId).toBe("lr-1");
    expect(log.minutesSpent).toBe(45);
    expect(log.unitsCompleted).toBe(2);

    const found = repo.getById("ll-1");
    expect(found?.date).toBe("2025-01-15");
  });

  it("gets by resource id", () => {
    repo.create("ll-1", { resourceId: "lr-1", date: "2025-01-15", minutesSpent: 30 });
    repo.create("ll-2", { resourceId: "lr-1", date: "2025-01-16", minutesSpent: 60 });
    repo.create("ll-3", { resourceId: "lr-1", date: "2025-01-17", minutesSpent: 15 });
    const logs = repo.getByResourceId("lr-1");
    expect(logs).toHaveLength(3);
  });

  it("gets by date range", () => {
    repo.create("ll-1", { resourceId: "lr-1", date: "2025-01-10", minutesSpent: 20 });
    repo.create("ll-2", { resourceId: "lr-1", date: "2025-01-15", minutesSpent: 40 });
    repo.create("ll-3", { resourceId: "lr-1", date: "2025-01-20", minutesSpent: 50 });
    const logs = repo.getByDateRange("2025-01-12", "2025-01-18");
    expect(logs).toHaveLength(1);
    expect(logs[0].date).toBe("2025-01-15");
  });

  it("updates a log", () => {
    repo.create("ll-1", { resourceId: "lr-1", date: "2025-01-15", minutesSpent: 30 });
    const updated = repo.update("ll-1", { minutesSpent: 45, notes: "Extended session" });
    expect(updated?.minutesSpent).toBe(45);
    expect(updated?.notes).toBe("Extended session");
    expect(repo.getById("ll-1")?.notes).toBe("Extended session");
  });

  it("deletes", () => {
    repo.create("ll-1", { resourceId: "lr-1", date: "2025-01-15", minutesSpent: 30 });
    expect(repo.delete("ll-1")).toBe(true);
    expect(repo.getById("ll-1")).toBeUndefined();
  });
});
