import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { loadConfig } from "../config.js";
import { createContainer } from "../container.js";

describe("Application Composition Root", () => {
  it("should initialize configuration, container, and app cleanly", () => {
    const config = loadConfig();
    config.dbPath = ":memory:";
    const container = createContainer(config);
    const app = createApp(container);

    expect(container.db).toBeDefined();
    expect(container.modules.auth).toBeDefined();
    expect(container.modules.finance).toBeDefined();
    expect(container.modules.habits).toBeDefined();
    expect(container.modules.health).toBeDefined();
    expect(app).toBeDefined();

    container.db.close();
  });
});
