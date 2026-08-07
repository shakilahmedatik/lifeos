import type express from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createDatabase } from "../../../shared/db.js";
import { createSettingsRouter } from "../router.js";

interface RouteStackLayer {
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: Array<{
      handle: (
        req: Record<string, unknown>,
        res: Record<string, unknown>,
        next: (err?: unknown) => void,
      ) => Promise<void>;
    }>;
  };
}

describe("Settings Module", () => {
  let db: ReturnType<typeof createDatabase>;
  let router: express.Router;

  beforeEach(async () => {
    db = createDatabase(":memory:");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    router = createSettingsRouter(db);
  });

  it("should get empty settings initially", async () => {
    let responseBody: unknown = null;

    const req = { method: "GET" };
    const res = {
      status(_code: number) {
        return this;
      },
      json(data: unknown) {
        responseBody = data;
        return this;
      },
    };

    const stack = (router as unknown as { stack: RouteStackLayer[] }).stack;
    const routeLayer = stack.find((layer) => layer.route && layer.route.path === "/");
    expect(routeLayer).toBeDefined();

    await routeLayer?.route?.stack[0].handle(req, res, (err?: unknown) => {
      if (err) throw err;
    });

    expect(responseBody).toEqual({});
  });

  it("should save and retrieve system settings in DB", async () => {
    let responseBody: unknown = null;

    const req = {
      body: { theme: "dark", default_sound: "chime" },
    };
    const res = {
      status(_code: number) {
        return this;
      },
      json(data: unknown) {
        responseBody = data;
        return this;
      },
    };

    const stack = (router as unknown as { stack: RouteStackLayer[] }).stack;
    const patchLayer = stack.find(
      (layer) => layer.route && layer.route.path === "/" && layer.route.methods.patch,
    );
    expect(patchLayer).toBeDefined();

    await patchLayer?.route?.stack[0].handle(req, res, (err?: unknown) => {
      if (err) throw err;
    });

    expect(responseBody).toEqual({
      theme: "dark",
      default_sound: "chime",
    });

    const dbRes = await db.execute("SELECT key, value FROM settings");
    expect(dbRes.rows.length).toBe(2);
  });
});
