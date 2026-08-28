import type { Server } from "node:http";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";
import express from "express";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runMigrations } from "../../../shared/migrations/runner.js";
import { createSyncRouter } from "../router.js";

describe("Sync Router Integration Tests", () => {
  let client: ReturnType<typeof createClient>;
  let app: express.Express;
  let server: Server;
  let baseUrl: string;

  beforeEach(async () => {
    client = createClient({ url: ":memory:" });

    // Run full migrations
    await runMigrations(
      client,
      fileURLToPath(new URL("../../../shared/migrations/", import.meta.url)),
    );

    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as unknown as { user: { id: string } }).user = { id: "test-user-1" };
      next();
    });
    app.use("/api/sync", createSyncRouter(client));

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
    client.close();
  });

  it("should pull updated routine categories from serverChanges", async () => {
    const now = new Date().toISOString();
    // Insert updated category on remote server
    await client.execute({
      sql: `INSERT INTO routine_categories (id, user_id, name, color, icon, is_default, sort_order, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 1, 0, ?, ?)`,
      args: ["work", "test-user-1", "Work", "#3b82f6", "💼", now, now],
    });

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

    const check = await client.execute({
      sql: "SELECT * FROM routine_categories WHERE id = ?",
      args: ["rcat_custom_1"],
    });

    expect(check.rows.length).toBe(1);
    expect(check.rows[0].name).toBe("Focus Session");
    expect(check.rows[0].icon).toBe("🎯");
    expect(check.rows[0].user_id).toBe("test-user-1");
  });

  it("should correctly pull changes when updated_at is in SQLite space format (YYYY-MM-DD HH:MM:SS)", async () => {
    // Insert updated category with space-formatted datetime (common in SQLite DEFAULT datetime('now'))
    await client.execute({
      sql: `INSERT INTO routine_categories (id, user_id, name, color, icon, is_default, sort_order, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 1, 0, '2026-08-15 12:00:00', '2026-08-15 12:30:00')`,
      args: ["habit", "test-user-1", "Habit", "#f97316", "⚡"],
    });

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
    await client.execute({
      sql: `INSERT INTO accounts (id, user_id, name, type, archived, created_at, updated_at)
            VALUES (?, ?, ?, ?, 0, ?, ?)`,
      args: ["acc_web_1", "test-user-1", "Bank Account", "bank", now, now],
    });
    await client.execute({
      sql: `INSERT INTO accounts (id, user_id, name, type, archived, created_at, updated_at)
            VALUES (?, '', ?, ?, 0, ?, ?)`,
      args: ["acc_web_2", "Cash Wallet", "cash", now, now],
    });

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
});
