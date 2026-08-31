import { type Client, createClient } from "@libsql/client";
import { beforeEach, describe, expect, it } from "vitest";
import type { HabitLogService } from "../application/habit-log-service.js";
import type { HabitService } from "../application/habit-service.js";
import { getDailyProgress, isCompleted } from "../domain/rules.js";
import type { HabitDefinition, HabitLogEntry } from "../domain/types.js";
import { initHabitsModule } from "../index.js";

describe("Typed Habit Domain Rules", () => {
  const waterHabit: HabitDefinition = {
    id: "h-water",
    name: "Drink Water",
    type: "water",
    category: "health",
    config: { type: "water", dailyGoalMl: 2000, sessionPresetsMl: [250, 500] },
    archived: false,
    sortOrder: 0,
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-01T00:00:00Z",
  };

  const prayerHabit: HabitDefinition = {
    id: "h-prayer",
    name: "Salah",
    type: "prayer",
    category: "mindfulness",
    config: {
      type: "prayer",
      prayers: [
        { name: "Fajr", time: "05:00" },
        { name: "Dhuhr", time: "13:00" },
        { name: "Asr", time: "16:30" },
        { name: "Maghrib", time: "19:00" },
        { name: "Isha", time: "20:30" },
      ],
    },
    archived: false,
    sortOrder: 1,
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-01T00:00:00Z",
  };

  it("calculates progress for water habit based on sum of ml logged", () => {
    const logs: HabitLogEntry[] = [
      {
        id: "1",
        habitId: "h-water",
        date: "2026-08-04",
        value: 500,
        loggedAt: "2026-08-04T08:00:00Z",
      },
      {
        id: "2",
        habitId: "h-water",
        date: "2026-08-04",
        value: 1000,
        loggedAt: "2026-08-04T12:00:00Z",
      },
    ];
    expect(getDailyProgress(waterHabit, logs)).toBe(0.75); // 1500 / 2000
    expect(isCompleted(waterHabit, logs)).toBe(false);

    const fullLogs = [
      ...logs,
      {
        id: "3",
        habitId: "h-water",
        date: "2026-08-04",
        value: 500,
        loggedAt: "2026-08-04T18:00:00Z",
      },
    ];
    expect(getDailyProgress(waterHabit, fullLogs)).toBe(1);
    expect(isCompleted(waterHabit, fullLogs)).toBe(true);
  });

  it("calculates progress for prayer habit (5 prayers = 1.0)", () => {
    const logs: HabitLogEntry[] = [
      {
        id: "1",
        habitId: "h-prayer",
        date: "2026-08-04",
        value: 1,
        meta: "Fajr",
        loggedAt: "2026-08-04T05:00:00Z",
      },
      {
        id: "2",
        habitId: "h-prayer",
        date: "2026-08-04",
        value: 1,
        meta: "Dhuhr",
        loggedAt: "2026-08-04T13:00:00Z",
      },
      {
        id: "3",
        habitId: "h-prayer",
        date: "2026-08-04",
        value: 1,
        meta: "Asr",
        loggedAt: "2026-08-04T16:30:00Z",
      },
    ];
    expect(getDailyProgress(prayerHabit, logs)).toBe(0.6); // 3 / 5
    expect(isCompleted(prayerHabit, logs)).toBe(false);
  });
});

describe("Habit Module Services Integration", () => {
  let client: Client;
  let habitService: HabitService;
  let habitLogService: HabitLogService;

  beforeEach(async () => {
    client = createClient({ url: ":memory:" });
    await client.execute(`
      CREATE TABLE habits (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'default',
        name TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL DEFAULT 'boolean',
        category TEXT NOT NULL DEFAULT 'general',
        icon TEXT,
        color TEXT,
        config TEXT NOT NULL DEFAULT '{"type":"boolean"}',
        archived INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        deleted_at TEXT
      );
    `);
    await client.execute(`
      CREATE TABLE habit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'default',
        habit_id TEXT NOT NULL,
        date TEXT NOT NULL,
        value REAL NOT NULL DEFAULT 1,
        meta TEXT,
        logged_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        deleted_at TEXT,
        FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
      );
    `);

    const module = initHabitsModule(client);
    habitService = module.habitService;
    habitLogService = module.habitLogService;
  });

  it("creates, retrieves, and logs typed habits", async () => {
    const created = await habitService.createHabit({
      name: "Water Intake",
      type: "water",
      category: "health",
      icon: "💧",
      config: { type: "water", dailyGoalMl: 3000, sessionPresetsMl: [250, 500] },
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe("Water Intake");
    expect(created.config.type).toBe("water");
    if (created.config.type === "water") {
      expect(created.config.dailyGoalMl).toBe(3000);
    }

    const log1 = await habitLogService.logHabit({
      habitId: created.id,
      date: "2026-08-04",
      value: 1000,
    });
    expect(log1.id).toBeDefined();
    expect(log1.value).toBe(1000);

    const due = await habitLogService.getTodayDueHabits("2026-08-04");
    expect(due).toHaveLength(1);
    expect(due[0].todayValue).toBe(1000);
    expect(due[0].todayTarget).toBe(3000);
    expect(due[0].todayProgress).toBeCloseTo(0.333, 2);
    expect(due[0].logs).toHaveLength(1);
    expect(due[0]?.logs?.[0]?.id).toBe(log1.id);
  });

  it("handles custom prayer counts in progress calculations", async () => {
    const customPrayer = await habitService.createHabit({
      name: "Custom Salah",
      type: "prayer",
      category: "mindfulness",
      config: {
        type: "prayer",
        prayers: [
          { name: "Fajr", time: "05:00" },
          { name: "Dhuhr", time: "13:00" },
          { name: "Asr", time: "16:30" },
          { name: "Isha", time: "20:30" },
        ],
      },
    });

    await habitLogService.logHabit({
      habitId: customPrayer.id,
      date: "2026-08-04",
      value: 1,
      meta: "Fajr",
    });

    const due = await habitLogService.getTodayDueHabits("2026-08-04");
    const found = due.find((h) => h.id === customPrayer.id);
    expect(found).toBeDefined();
    expect(found?.todayTarget).toBe(4);
    expect(found?.todayProgress).toBe(0.25);
  });

  it("calculates analytics correctly for a habit with getAnalytics", async () => {
    const habit = await habitService.createHabit({
      name: "Study",
      type: "timed",
      config: { type: "timed", dailyGoalMinutes: 60 },
    });

    await habitLogService.logHabit({
      habitId: habit.id,
      date: "2026-08-14",
      value: 60,
    });

    const module = initHabitsModule(client);
    const stats = await module.habitStatsService.getAnalytics(
      habit.id,
      "week",
      "default",
      "2026-08-14",
    );
    expect(stats).toBeDefined();
    expect(stats?.totalValue).toBe(60);
    expect(stats?.completionRate).toBe(14);
    expect(stats?.dailyValues).toHaveLength(7);
    expect(stats?.dailyValues[6].value).toBe(60);
  });
});
