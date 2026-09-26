import type { Server } from "node:http";
import { sql } from "drizzle-orm";
import express from "express";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { DrizzleClient } from "../../../shared/db.js";
import { createTestDatabase } from "../../../shared/test-db.js";
import { createSyncRouter } from "../router.js";

describe("Sync Router Integration Tests", () => {
  let db: DrizzleClient;
  let app: express.Express;
  let server: Server;
  let baseUrl: string;

  beforeEach(async () => {
    db = await createTestDatabase();

    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as unknown as { user: { id: string } }).user = { id: "test-user-1" };
      next();
    });
    app.use("/api/sync", createSyncRouter(db));

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === "object") {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it("should pull updated routine categories from serverChanges", async () => {
    const now = new Date().toISOString();
    // Insert updated category on remote server
    await db.run(sql`INSERT INTO routine_categories (id, user_id, name, color, icon, is_default, sort_order, created_at, updated_at)
          VALUES (${"work"}, ${"test-user-1"}, ${"Work"}, ${"#3b82f6"}, ${"💼"}, 1, 0, ${now}, ${now})`);

    const pastDate = new Date(Date.now() - 60000).toISOString();

    const response = await fetch(`${baseUrl}/api/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lastSyncAt: pastDate,
        changes: {},
      }),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      serverChanges: Record<string, Array<{ id: string; icon: string }>>;
    };
    expect(body.serverChanges).toBeDefined();
    expect(body.serverChanges.routine_categories).toBeDefined();
    expect(body.serverChanges.routine_categories.length).toBe(1);
    expect(body.serverChanges.routine_categories[0].id).toBe("work");
    expect(body.serverChanges.routine_categories[0].icon).toBe("💼");
  });

  it("should push client routine_categories changes to server", async () => {
    const now = new Date().toISOString();

    const response = await fetch(`${baseUrl}/api/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lastSyncAt: null,
        changes: {
          routine_categories: [
            {
              id: "rcat_custom_1",
              name: "Focus Session",
              color: "#a855f7",
              icon: "🎯",
              is_default: 0,
              sort_order: 10,
              created_at: now,
              updated_at: now,
            },
          ],
        },
      }),
    });

    expect(response.status).toBe(200);

    const check = await db.all<{ id: string; name: string; icon: string; user_id: string }>(
      sql`SELECT * FROM routine_categories WHERE id = ${"rcat_custom_1"}`,
    );

    expect(check.length).toBe(1);
    expect(check[0].name).toBe("Focus Session");
    expect(check[0].icon).toBe("🎯");
    expect(check[0].user_id).toBe("test-user-1");
  });

  it("should correctly pull changes when updated_at is in SQLite space format (YYYY-MM-DD HH:MM:SS)", async () => {
    // Insert updated category with space-formatted datetime
    await db.run(sql`INSERT INTO routine_categories (id, user_id, name, color, icon, is_default, sort_order, created_at, updated_at)
          VALUES (${"habit"}, ${"test-user-1"}, ${"Habit"}, ${"#f97316"}, ${"⚡"}, 1, 0, ${"2026-08-15 12:00:00"}, ${"2026-08-15 12:30:00"})`);

    // Client lastSyncAt is ISO string before the update
    const pastIsoDate = "2026-08-15T12:00:00.000Z";

    const response = await fetch(`${baseUrl}/api/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lastSyncAt: pastIsoDate,
        changes: {},
      }),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      serverChanges: Record<string, Array<{ id: string; icon: string }>>;
    };
    expect(body.serverChanges).toBeDefined();
    expect(body.serverChanges.routine_categories).toBeDefined();
    expect(body.serverChanges.routine_categories.length).toBe(1);
    expect(body.serverChanges.routine_categories[0].id).toBe("habit");
    expect(body.serverChanges.routine_categories[0].icon).toBe("⚡");
  });

  it("should pull accounts created on web when syncing", async () => {
    const now = new Date().toISOString();
    // Insert accounts on remote server
    await db.run(sql`INSERT INTO accounts (id, user_id, name, type, archived, created_at, updated_at)
          VALUES (${"acc_web_1"}, ${"test-user-1"}, ${"Bank Account"}, ${"bank"}, 0, ${now}, ${now})`);
    await db.run(sql`INSERT INTO accounts (id, user_id, name, type, archived, created_at, updated_at)
          VALUES (${"acc_web_2"}, ${""}, ${"Cash Wallet"}, ${"cash"}, 0, ${now}, ${now})`);

    const response = await fetch(`${baseUrl}/api/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lastSyncAt: null,
        forceFull: true,
        changes: {},
      }),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      serverChanges: Record<string, Array<{ id: string; name: string }>>;
    };
    expect(body.serverChanges).toBeDefined();
    expect(body.serverChanges.accounts).toBeDefined();
    expect(body.serverChanges.accounts.length).toBe(2);
    const accountIds = body.serverChanges.accounts.map((a) => a.id);
    expect(accountIds).toContain("acc_web_1");
    expect(accountIds).toContain("acc_web_2");
  });

  it("should push settings and update them on conflict without throwing unique constraint error", async () => {
    const now = new Date().toISOString();

    // 1. First push creates the setting
    const res1 = await fetch(`${baseUrl}/api/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lastSyncAt: null,
        changes: {
          settings: [
            {
              key: "theme",
              value: "dark",
              updated_at: now,
            },
          ],
        },
      }),
    });
    expect(res1.status).toBe(200);

    const check1 = await db.all<{ key: string; value: string; user_id: string }>(
      sql`SELECT * FROM settings WHERE key = ${"theme"}`,
    );
    expect(check1.length).toBe(1);
    expect(check1[0].value).toBe("dark");

    // 2. Second push updates the setting on conflict
    const res2 = await fetch(`${baseUrl}/api/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lastSyncAt: null,
        changes: {
          settings: [
            {
              key: "theme",
              value: "system",
              updated_at: new Date().toISOString(),
            },
          ],
        },
      }),
    });
    expect(res2.status).toBe(200);

    const check2 = await db.all<{ key: string; value: string; user_id: string }>(
      sql`SELECT * FROM settings WHERE key = ${"theme"}`,
    );
    expect(check2.length).toBe(1);
    expect(check2[0].value).toBe("system");
    expect(check2[0].user_id).toBe("test-user-1");
  });
});
