import { describe, expect, it } from "vitest";
import { validateBackup } from "../backup";

describe("validateBackup", () => {
  it("accepts a valid backup object", () => {
    const valid = {
      id: "test-1",
      timestamp: "2026-01-01T00:00:00.000Z",
      version: "1.0.0",
      schema: "lifeos-learning-backup",
      data: {
        areas: [],
        resources: [],
        logs: [],
      },
    };
    expect(validateBackup(valid)).toBe(true);
  });

  it("accepts valid backup with nested data", () => {
    const valid = {
      id: "test-1",
      timestamp: "2026-01-01T00:00:00.000Z",
      version: "1.0.0",
      schema: "lifeos-learning-backup",
      data: {
        areas: [{ id: "a1", name: "Coding", createdAt: "", updatedAt: "" }],
        resources: [
          {
            id: "r1",
            title: "Test",
            skillAreaId: "a1",
            type: "course" as const,
            createdAt: "",
            updatedAt: "",
          },
        ],
        logs: [
          {
            id: "l1",
            resourceId: "r1",
            date: "2026-01-01",
            minutesSpent: 30,
            createdAt: "",
            updatedAt: "",
          },
        ],
      },
    };
    expect(validateBackup(valid)).toBe(true);
  });

  it("rejects null", () => {
    expect(validateBackup(null)).toBe(false);
  });

  it("rejects a string", () => {
    expect(validateBackup("not a backup")).toBe(false);
  });

  it("rejects a number", () => {
    expect(validateBackup(42)).toBe(false);
  });

  it("rejects an array", () => {
    expect(validateBackup([1, 2, 3])).toBe(false);
  });

  it("rejects missing id", () => {
    expect(
      validateBackup({
        timestamp: "x",
        version: "1",
        schema: "lifeos-learning-backup",
        data: { areas: [], resources: [], logs: [] },
      }),
    ).toBe(false);
  });

  it("rejects missing timestamp", () => {
    expect(
      validateBackup({
        id: "x",
        version: "1",
        schema: "lifeos-learning-backup",
        data: { areas: [], resources: [], logs: [] },
      }),
    ).toBe(false);
  });

  it("rejects missing version", () => {
    expect(
      validateBackup({
        id: "x",
        timestamp: "x",
        schema: "lifeos-learning-backup",
        data: { areas: [], resources: [], logs: [] },
      }),
    ).toBe(false);
  });

  it("rejects missing schema", () => {
    expect(
      validateBackup({
        id: "x",
        timestamp: "x",
        version: "1",
        data: { areas: [], resources: [], logs: [] },
      }),
    ).toBe(false);
  });

  it("rejects wrong schema value", () => {
    const wrong = {
      id: "x",
      timestamp: "x",
      version: "1",
      schema: "wrong-schema",
      data: { areas: [], resources: [], logs: [] },
    };
    expect(validateBackup(wrong)).toBe(false);
  });

  it("rejects wrong schema type", () => {
    const wrongSchemaType = {
      id: "x",
      timestamp: "x",
      version: "1",
      schema: 123,
      data: { areas: [], resources: [], logs: [] },
    };
    expect(validateBackup(wrongSchemaType)).toBe(false);
  });

  it("rejects missing data", () => {
    const noData = { id: "x", timestamp: "x", version: "1", schema: "lifeos-learning-backup" };
    expect(validateBackup(noData)).toBe(false);
  });

  it("rejects missing data.areas", () => {
    const noAreas = {
      id: "x",
      timestamp: "x",
      version: "1",
      schema: "lifeos-learning-backup",
      data: { resources: [], logs: [] },
    };
    expect(validateBackup(noAreas)).toBe(false);
  });

  it("rejects missing data.resources", () => {
    const noResources = {
      id: "x",
      timestamp: "x",
      version: "1",
      schema: "lifeos-learning-backup",
      data: { areas: [], logs: [] },
    };
    expect(validateBackup(noResources)).toBe(false);
  });

  it("rejects missing data.logs", () => {
    const noLogs = {
      id: "x",
      timestamp: "x",
      version: "1",
      schema: "lifeos-learning-backup",
      data: { areas: [], resources: [] },
    };
    expect(validateBackup(noLogs)).toBe(false);
  });

  it("rejects non-array areas in backup", () => {
    const bad = {
      id: "x",
      timestamp: "x",
      version: "1",
      schema: "lifeos-learning-backup",
      data: { areas: {}, resources: [], logs: [] },
    };
    expect(validateBackup(bad)).toBe(false);
  });

  it("rejects non-array resources in backup", () => {
    const bad = {
      id: "x",
      timestamp: "x",
      version: "1",
      schema: "lifeos-learning-backup",
      data: { areas: [], resources: {}, logs: [] },
    };
    expect(validateBackup(bad)).toBe(false);
  });

  it("rejects non-array logs in backup", () => {
    const bad = {
      id: "x",
      timestamp: "x",
      version: "1",
      schema: "lifeos-learning-backup",
      data: { areas: [], resources: [], logs: {} },
    };
    expect(validateBackup(bad)).toBe(false);
  });

  it("rejects null id", () => {
    const bad = {
      id: null,
      timestamp: "x",
      version: "1",
      schema: "lifeos-learning-backup",
      data: { areas: [], resources: [], logs: [] },
    };
    expect(validateBackup(bad)).toBe(false);
  });

  it("rejects undefined input", () => {
    // @ts-expect-error testing runtime behavior
    expect(validateBackup(undefined)).toBe(false);
  });
});
