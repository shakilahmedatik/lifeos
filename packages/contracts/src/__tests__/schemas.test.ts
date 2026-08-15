import { describe, expect, it } from "vitest";
import {
  NewExerciseInputSchema,
  NewNotificationInputSchema,
  NewRoutineCategoryInputSchema,
  NewTransactionInputSchema,
  TransferInputSchema,
  UpdateNotificationInputSchema,
  UpdateRoutineCategoryInputSchema,
} from "../schemas.js";

describe("TransferInputSchema", () => {
  it("accepts valid transfer input", () => {
    const result = TransferInputSchema.safeParse({
      fromAccountId: "acc-1",
      toAccountId: "acc-2",
      amountMinor: 100000,
      date: "2026-07-22",
      note: "ATM withdrawal",
    });
    expect(result.success).toBe(true);
  });

  it("accepts transfer without optional note", () => {
    const result = TransferInputSchema.safeParse({
      fromAccountId: "acc-1",
      toAccountId: "acc-2",
      amountMinor: 5000,
      date: "2026-07-22",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing fromAccountId", () => {
    const result = TransferInputSchema.safeParse({
      toAccountId: "acc-2",
      amountMinor: 5000,
      date: "2026-07-22",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing toAccountId", () => {
    const result = TransferInputSchema.safeParse({
      fromAccountId: "acc-1",
      amountMinor: 5000,
      date: "2026-07-22",
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero amountMinor", () => {
    const result = TransferInputSchema.safeParse({
      fromAccountId: "acc-1",
      toAccountId: "acc-2",
      amountMinor: 0,
      date: "2026-07-22",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative amountMinor", () => {
    const result = TransferInputSchema.safeParse({
      fromAccountId: "acc-1",
      toAccountId: "acc-2",
      amountMinor: -100,
      date: "2026-07-22",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer amountMinor", () => {
    const result = TransferInputSchema.safeParse({
      fromAccountId: "acc-1",
      toAccountId: "acc-2",
      amountMinor: 10.5,
      date: "2026-07-22",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid date format", () => {
    const result = TransferInputSchema.safeParse({
      fromAccountId: "acc-1",
      toAccountId: "acc-2",
      amountMinor: 5000,
      date: "07-22-2026",
    });
    expect(result.success).toBe(false);
  });

  it("rejects note exceeding max length", () => {
    const result = TransferInputSchema.safeParse({
      fromAccountId: "acc-1",
      toAccountId: "acc-2",
      amountMinor: 5000,
      date: "2026-07-22",
      note: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("UpdateNotificationInputSchema", () => {
  it("accepts valid status update", () => {
    const result = UpdateNotificationInputSchema.safeParse({ status: "sent" });
    expect(result.success).toBe(true);
  });

  it("accepts valid reminderTime update", () => {
    const result = UpdateNotificationInputSchema.safeParse({
      reminderTime: "2026-07-22T09:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid soundType update", () => {
    const result = UpdateNotificationInputSchema.safeParse({ soundType: "urgent" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (no fields to update)", () => {
    const result = UpdateNotificationInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = UpdateNotificationInputSchema.safeParse({ status: "invalid" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid soundType", () => {
    const result = UpdateNotificationInputSchema.safeParse({ soundType: "invalid" });
    expect(result.success).toBe(false);
  });
});

describe("NewTransactionInputSchema", () => {
  it("accepts valid transaction input", () => {
    const result = NewTransactionInputSchema.safeParse({
      accountId: "acc-1",
      categoryId: "cat-1",
      date: "2026-07-22",
      amountMinor: 5000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing accountId", () => {
    const result = NewTransactionInputSchema.safeParse({
      categoryId: "cat-1",
      date: "2026-07-22",
      amountMinor: 5000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer amountMinor", () => {
    const result = NewTransactionInputSchema.safeParse({
      accountId: "acc-1",
      categoryId: "cat-1",
      date: "2026-07-22",
      amountMinor: 10.5,
    });
    expect(result.success).toBe(false);
  });
});

describe("NewNotificationInputSchema", () => {
  it("accepts valid notification input", () => {
    const result = NewNotificationInputSchema.safeParse({
      taskId: "task-1",
      reminderTime: "2026-07-22T09:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("accepts notification with soundType", () => {
    const result = NewNotificationInputSchema.safeParse({
      taskId: "task-1",
      reminderTime: "2026-07-22T09:00:00Z",
      soundType: "gentle",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing taskId", () => {
    const result = NewNotificationInputSchema.safeParse({
      reminderTime: "2026-07-22T09:00:00Z",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing reminderTime", () => {
    const result = NewNotificationInputSchema.safeParse({
      taskId: "task-1",
    });
    expect(result.success).toBe(false);
  });
});

describe("NewExerciseInputSchema", () => {
  it("accepts exercise with empty string videoUrl", () => {
    const result = NewExerciseInputSchema.safeParse({
      name: "Bicep Curls",
      muscleGroup: "biceps",
      equipment: "dumbbell",
      videoUrl: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts exercise with valid url videoUrl", () => {
    const result = NewExerciseInputSchema.safeParse({
      name: "Bicep Curls",
      videoUrl: "https://example.com/demo.mp4",
    });
    expect(result.success).toBe(true);
  });
});

describe("RoutineCategory Schemas", () => {
  it("accepts valid NewRoutineCategoryInput", () => {
    const result = NewRoutineCategoryInputSchema.safeParse({
      name: "Deep Work",
      color: "#3b82f6",
      icon: "⚡",
      sortOrder: 1,
    });
    expect(result.success).toBe(true);
  });

  it("rejects NewRoutineCategoryInput with empty name", () => {
    const result = NewRoutineCategoryInputSchema.safeParse({
      name: "",
      color: "#3b82f6",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid hex color format in NewRoutineCategoryInput", () => {
    const result = NewRoutineCategoryInputSchema.safeParse({
      name: "Deep Work",
      color: "not-a-color",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid UpdateRoutineCategoryInput", () => {
    const result = UpdateRoutineCategoryInputSchema.safeParse({
      name: "Focus Time",
      color: "#8b5cf6",
    });
    expect(result.success).toBe(true);
  });
});
