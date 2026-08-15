import {
  type Account,
  type AccountType,
  type AccountWithBalance,
  type Category,
  type CategoryBreakdown,
  type CategoryKind,
  type DashboardHabitConsistency,
  type DashboardSummary,
  type FinanceDashboardWidget,
  getClientDateString,
  type HabitAnalyticsData,
  type HabitDefinition,
  type HabitLogEntry,
  type HabitStats,
  type HabitWithStreak,
  type LearningLog,
  type LearningResource,
  type LearningUnit,
  type MonthlySummary,
  type NewAccountInput,
  type NewCategoryInput,
  type NewHabitDefinitionInput,
  type NewLearningLogInput,
  type NewLearningResourceInput,
  type NewNotificationInput,
  type NewReminderInput,
  type NewSkillAreaInput,
  type NewTaskInput,
  type NewTransactionInput,
  type Notification,
  type NotificationSoundType,
  type NotificationWithTask,
  type Reminder,
  type ResourceWithProgress,
  type RoutineStats,
  type SkillArea,
  type SkillAreaSummary,
  type Task,
  type TaskCategory,
  type TaskHistoryQuery,
  type TaskStatus,
  type Transaction,
  type UpdateLearningLogInput,
  type UpdateLearningResourceInput,
  type UpdateReminderInput,
  type UpdateSkillAreaInput,
  type WeeklySummary,
} from "@lifeos/contracts";
import { getLocalDb } from "./index.js";

type SqliteRow = Record<string, unknown>;

export const localDal = {
  // --- Routine ---
  getTasks: async (date: string): Promise<Task[]> => {
    const db = await getLocalDb();
    const rows = await db.select<SqliteRow[]>(
      "SELECT * FROM tasks WHERE date = ? AND deleted_at IS NULL ORDER BY start_time ASC",
      [date],
    );
    return rows.map((r) => ({
      id: String(r.id),
      title: String(r.title),
      category: r.category as TaskCategory,
      date: String(r.date),
      startTime: String(r.start_time),
      endTime: String(r.end_time),
      status: r.status as TaskStatus,
      notes: r.notes ? String(r.notes) : undefined,
      reminderMinutesBefore:
        typeof r.reminder_minutes_before === "number" ? r.reminder_minutes_before : null,
      reminderSilent: Boolean(r.reminder_silent),
      reminderSound: (r.reminder_sound as NotificationSoundType) || "default",
      subtasks: typeof r.subtasks === "string" ? JSON.parse(r.subtasks) : [],
      referenceId: r.reference_id ? String(r.reference_id) : undefined,
      recurrence: (r.recurrence as Task["recurrence"]) || "none",
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));
  },

  createTask: async (input: NewTaskInput): Promise<{ task: Task; overlapsWith: Task[] }> => {
    const db = await getLocalDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const task: Task = {
      id,
      title: input.title,
      category: input.category ?? "general",
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      status: "planned",
      notes: input.notes,
      reminderMinutesBefore: input.reminderMinutesBefore ?? null,
      reminderSilent: input.reminderSilent ?? false,
      reminderSound: input.reminderSound ?? "default",
      recurrence: input.recurrence ?? "none",
      subtasks: input.subtasks ?? [],
      referenceId: input.referenceId,
      createdAt: now,
      updatedAt: now,
    };

    await db.execute(
      `INSERT INTO tasks (id, user_id, title, category, date, start_time, end_time, status, notes, reminder_minutes_before, reminder_sound, recurrence, subtasks, reference_id, created_at, updated_at, _sync_status)
       VALUES (?, '', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        task.id,
        task.title,
        task.category,
        task.date,
        task.startTime,
        task.endTime,
        task.status,
        task.notes ?? null,
        task.reminderMinutesBefore ?? null,
        task.reminderSound,
        task.recurrence,
        JSON.stringify(task.subtasks),
        task.referenceId ?? null,
        task.createdAt,
        task.updatedAt,
      ],
    );

    return { task, overlapsWith: [] };
  },

  updateTaskStatus: async (id: string, status: Task["status"]): Promise<Task> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE tasks SET status = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [status, now, id],
    );
    const rows = await localDal.getTasks(now.split("T")[0]);
    const found = rows.find((t) => t.id === id);
    if (!found) throw new Error("Task not found");
    return found;
  },

  updateTask: async (
    id: string,
    patch: Partial<NewTaskInput>,
  ): Promise<{ task: Task; overlapsWith: Task[] }> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    const existing = (await db.select<SqliteRow[]>("SELECT * FROM tasks WHERE id = ?", [id]))[0];
    if (!existing) throw new Error("Task not found");

    const updated = {
      title: patch.title ?? String(existing.title),
      category: patch.category ?? (existing.category as TaskCategory),
      date: patch.date ?? String(existing.date),
      startTime: patch.startTime ?? String(existing.start_time),
      endTime: patch.endTime ?? String(existing.end_time),
      status: (existing.status as TaskStatus) || "planned",
      notes: patch.notes ?? (existing.notes ? String(existing.notes) : undefined),
      subtasks: patch.subtasks ? JSON.stringify(patch.subtasks) : String(existing.subtasks || "[]"),
      updated_at: now,
    };

    await db.execute(
      `UPDATE tasks SET title = ?, category = ?, date = ?, start_time = ?, end_time = ?, status = ?, notes = ?, subtasks = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?`,
      [
        updated.title,
        updated.category,
        updated.date,
        updated.startTime,
        updated.endTime,
        updated.status,
        updated.notes ?? null,
        updated.subtasks,
        now,
        id,
      ],
    );

    const task: Task = {
      id,
      title: updated.title,
      category: updated.category,
      date: updated.date,
      startTime: updated.startTime,
      endTime: updated.endTime,
      status: updated.status,
      notes: updated.notes,
      reminderSilent: Boolean(existing.reminder_silent),
      subtasks: typeof updated.subtasks === "string" ? JSON.parse(updated.subtasks) : [],
      createdAt: String(existing.created_at),
      updatedAt: now,
    };

    return { task, overlapsWith: [] };
  },

  deleteTask: async (id: string): Promise<void> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE tasks SET deleted_at = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [now, now, id],
    );
  },

  getTaskHistory: async (query?: TaskHistoryQuery): Promise<Task[]> => {
    const db = await getLocalDb();
    let sql = "SELECT * FROM tasks WHERE deleted_at IS NULL";
    const args: unknown[] = [];

    if (query?.startDate) {
      sql += " AND date >= ?";
      args.push(query.startDate);
    }
    if (query?.endDate) {
      sql += " AND date <= ?";
      args.push(query.endDate);
    }
    if (query?.category && query.category !== "all") {
      sql += " AND category = ?";
      args.push(query.category);
    }
    if (query?.status && query.status !== "all") {
      sql += " AND status = ?";
      args.push(query.status);
    }
    sql += " ORDER BY date DESC, start_time ASC";

    const rows = await db.select<SqliteRow[]>(sql, args);
    return rows.map((r) => ({
      id: String(r.id),
      title: String(r.title),
      category: r.category as TaskCategory,
      date: String(r.date),
      startTime: String(r.start_time),
      endTime: String(r.end_time),
      status: r.status as TaskStatus,
      notes: r.notes ? String(r.notes) : undefined,
      reminderMinutesBefore:
        typeof r.reminder_minutes_before === "number" ? r.reminder_minutes_before : null,
      reminderSilent: Boolean(r.reminder_silent),
      reminderSound: (r.reminder_sound as NotificationSoundType) || "default",
      subtasks: typeof r.subtasks === "string" ? JSON.parse(r.subtasks) : [],
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));
  },

  getRoutineStats: async (): Promise<RoutineStats> => {
    const db = await getLocalDb();
    const totalRes = await db.select<{ count: number }[]>(
      "SELECT COUNT(*) as count FROM tasks WHERE deleted_at IS NULL",
    );
    const doneRes = await db.select<{ count: number }[]>(
      "SELECT COUNT(*) as count FROM tasks WHERE deleted_at IS NULL AND status = 'done'",
    );

    const totalTasks = totalRes[0]?.count || 0;
    const completedTasks = doneRes[0]?.count || 0;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      plannedTasks: totalTasks - completedTasks,
      inProgressTasks: 0,
      skippedTasks: 0,
      completionRate,
      totalScheduledMinutes: 0,
      completedMinutes: 0,
      completedTodayCount: completedTasks,
      totalTodayCount: totalTasks,
      todayCompletionRate: completionRate,
      categoryDistribution: [],
      weeklyTrends: [],
    };
  },

  // --- Habits ---
  getHabits: async (): Promise<HabitDefinition[]> => {
    const db = await getLocalDb();
    const rows = await db.select<SqliteRow[]>(
      "SELECT * FROM habits WHERE deleted_at IS NULL ORDER BY sort_order ASC",
    );
    return rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      type: r.type as HabitDefinition["type"],
      category: (r.category as HabitDefinition["category"]) || "general",
      config: typeof r.config === "string" ? JSON.parse(r.config) : r.config,
      icon: r.icon ? String(r.icon) : undefined,
      color: r.color ? String(r.color) : undefined,
      archived: Boolean(r.archived),
      sortOrder: Number(r.sort_order),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));
  },

  createHabit: async (input: NewHabitDefinitionInput): Promise<HabitDefinition> => {
    const db = await getLocalDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const habit: HabitDefinition = {
      id,
      name: input.name,
      type: input.type,
      category: input.category ?? "general",
      config: input.config,
      icon: input.icon,
      color: input.color,
      archived: false,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    };

    await db.execute(
      `INSERT INTO habits (id, user_id, name, frequency, target_days_per_week, type, category, config, icon, color, archived, sort_order, created_at, updated_at, _sync_status)
       VALUES (?, '', ?, 'daily', 7, ?, ?, ?, ?, ?, 0, 0, ?, ?, 'pending')`,
      [
        habit.id,
        habit.name,
        habit.type,
        habit.category,
        JSON.stringify(habit.config),
        habit.icon ?? null,
        habit.color ?? null,
        now,
        now,
      ],
    );

    return habit;
  },

  updateHabit: async (
    id: string,
    patch: Partial<NewHabitDefinitionInput>,
  ): Promise<HabitDefinition> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    const existing = (await db.select<SqliteRow[]>("SELECT * FROM habits WHERE id = ?", [id]))[0];
    if (!existing) throw new Error("Habit not found");

    const updated = {
      name: patch.name ?? String(existing.name),
      category: patch.category ?? String(existing.category || "general"),
      icon: patch.icon !== undefined ? patch.icon : existing.icon ? String(existing.icon) : null,
      color:
        patch.color !== undefined ? patch.color : existing.color ? String(existing.color) : null,
      config: patch.config ? JSON.stringify(patch.config) : String(existing.config),
      archived:
        (patch as { archived?: boolean }).archived !== undefined
          ? (patch as { archived?: boolean }).archived
            ? 1
            : 0
          : existing.archived
            ? 1
            : 0,
      sort_order:
        (patch as { sortOrder?: number }).sortOrder !== undefined
          ? Number((patch as { sortOrder?: number }).sortOrder)
          : Number(existing.sort_order || 0),
      updated_at: now,
    };

    await db.execute(
      `UPDATE habits SET name = ?, category = ?, icon = ?, color = ?, config = ?, archived = ?, sort_order = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?`,
      [
        updated.name,
        updated.category,
        updated.icon,
        updated.color,
        updated.config,
        updated.archived,
        updated.sort_order,
        now,
        id,
      ],
    );

    const found = (await localDal.getHabits()).find((h) => h.id === id);
    if (!found) throw new Error("Updated habit not found");
    return found;
  },

  deleteHabit: async (id: string): Promise<void> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE habits SET deleted_at = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [now, now, id],
    );
  },

  logHabit: async (
    habitId: string,
    date?: string,
    value = 1,
    meta?: string,
  ): Promise<HabitLogEntry> => {
    const db = await getLocalDb();
    const id = crypto.randomUUID();
    const logDate = date || new Date().toISOString().split("T")[0];
    const now = new Date().toISOString();

    const entry: HabitLogEntry = {
      id,
      habitId,
      date: logDate,
      value,
      meta,
      loggedAt: now,
    };

    await db.execute(
      `INSERT INTO habit_logs (id, user_id, habit_id, date, value, meta, logged_at, _sync_status)
       VALUES (?, '', ?, ?, ?, ?, ?, 'pending')`,
      [entry.id, entry.habitId, entry.date, entry.value, entry.meta ?? null, entry.loggedAt],
    );

    return entry;
  },

  unlogHabit: async (habitId: string, date: string): Promise<void> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE habit_logs SET deleted_at = ?, _sync_status = 'pending' WHERE habit_id = ? AND date = ?",
      [now, habitId, date],
    );
  },

  unlogHabitByLogId: async (logId: string): Promise<void> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE habit_logs SET deleted_at = ?, _sync_status = 'pending' WHERE id = ?",
      [now, logId],
    );
  },

  getTodayHabits: async (): Promise<HabitWithStreak[]> => {
    const habits = await localDal.getHabits();
    const today = new Date().toISOString().split("T")[0];
    const db = await getLocalDb();

    const activeHabits = habits.filter((h) => !h.archived);
    const result: HabitWithStreak[] = [];

    for (const h of activeHabits) {
      const rows = await db.select<SqliteRow[]>(
        "SELECT * FROM habit_logs WHERE habit_id = ? AND date = ? AND deleted_at IS NULL",
        [h.id, today],
      );
      const logs: HabitLogEntry[] = rows.map((l) => ({
        id: String(l.id),
        habitId: String(l.habit_id),
        date: String(l.date),
        value: Number(l.value) || 1,
        meta: l.meta ? String(l.meta) : undefined,
        loggedAt: String(l.logged_at),
      }));
      const todayValue = logs.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
      result.push({
        ...h,
        currentStreak: todayValue > 0 ? 1 : 0,
        longestStreak: 1,
        loggedToday: todayValue > 0,
        todayProgress: todayValue > 0 ? 1 : 0,
        todayValue,
        todayTarget: 1,
        logs,
      });
    }

    return result;
  },

  getHabitStats: async (id: string, _startDate: string, _endDate: string): Promise<HabitStats> => {
    const db = await getLocalDb();
    const logs = await db.select<SqliteRow[]>(
      "SELECT * FROM habit_logs WHERE habit_id = ? AND deleted_at IS NULL ORDER BY date DESC",
      [id],
    );
    return {
      habitId: id,
      totalCompletions: logs.length,
      currentStreak: logs.length > 0 ? 1 : 0,
      longestStreak: logs.length > 0 ? 1 : 0,
      completionRate: 100,
    };
  },

  getHabitAnalytics: async (
    habitId: string,
    period: "week" | "month" = "week",
    endDate?: string,
  ): Promise<HabitAnalyticsData | undefined> => {
    const db = await getLocalDb();
    const habitRows = await db.select<SqliteRow[]>(
      "SELECT * FROM habits WHERE id = ? AND deleted_at IS NULL",
      [habitId],
    );
    if (habitRows.length === 0) return undefined;
    const habitRow = habitRows[0];
    let config = { type: habitRow.type || "boolean" };
    try {
      if (habitRow.config) config = JSON.parse(String(habitRow.config));
    } catch {}

    const todayStr = endDate || getClientDateString();
    const [y, m, d] = todayStr.split("-").map(Number);
    const end = new Date(Date.UTC(y, m - 1, d));
    const totalDays = period === "week" ? 7 : 30;
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - (totalDays - 1));

    const pad = (n: number) => String(n).padStart(2, "0");
    const startDateStr = `${start.getUTCFullYear()}-${pad(start.getUTCMonth() + 1)}-${pad(start.getUTCDate())}`;

    const rawLogs = await db.select<SqliteRow[]>(
      "SELECT * FROM habit_logs WHERE habit_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL ORDER BY date ASC, logged_at ASC",
      [habitId, startDateStr, todayStr],
    );

    const logsByDate = new Map<string, number>();
    for (const row of rawLogs) {
      const d = String(row.date);
      const val = Number(row.value) || 1;
      logsByDate.set(d, (logsByDate.get(d) || 0) + val);
    }

    let target = 1;
    if (habitRow.type === "water" && "dailyGoalMl" in config) {
      target = Number(config.dailyGoalMl) || 2500;
    } else if (habitRow.type === "walking" && "dailyGoal" in config) {
      target = Number(config.dailyGoal) || 10000;
    } else if (habitRow.type === "timed" && "dailyGoalMinutes" in config) {
      target = Number(config.dailyGoalMinutes) || 30;
    } else if (habitRow.type === "prayer") {
      target = Array.isArray((config as { prayers?: unknown[] }).prayers)
        ? (config as { prayers?: unknown[] }).prayers?.length || 5
        : 5;
    }

    const dailyValues: { date: string; value: number; target: number }[] = [];
    let completedDays = 0;
    let totalValue = 0;

    for (let i = 0; i < totalDays; i++) {
      const cur = new Date(start);
      cur.setUTCDate(start.getUTCDate() + i);
      const curStr = `${cur.getUTCFullYear()}-${pad(cur.getUTCMonth() + 1)}-${pad(cur.getUTCDate())}`;
      const dayVal = logsByDate.get(curStr) || 0;
      totalValue += dayVal;
      if (dayVal >= target && target > 0) completedDays++;

      dailyValues.push({
        date: curStr,
        value: dayVal,
        target,
      });
    }

    const completionRate = Math.round((completedDays / totalDays) * 100);
    const averageValue = Math.round((totalValue / totalDays) * 10) / 10;

    let streak = 0;
    const checkDate = new Date(end);
    for (let i = 0; i < 365; i++) {
      const dStr = `${checkDate.getUTCFullYear()}-${pad(checkDate.getUTCMonth() + 1)}-${pad(checkDate.getUTCDate())}`;
      const val = logsByDate.get(dStr) || 0;
      if (val >= target) {
        streak++;
        checkDate.setUTCDate(checkDate.getUTCDate() - 1);
      } else {
        if (i === 0) {
          checkDate.setUTCDate(checkDate.getUTCDate() - 1);
          continue;
        }
        break;
      }
    }

    return {
      habitId,
      period,
      dailyValues,
      completionRate,
      currentStreak: streak,
      longestStreak: streak,
      totalValue,
      averageValue,
    };
  },

  getWeeklyReview: async (weekStart?: string): Promise<WeeklySummary> => {
    const db = await getLocalDb();
    const habits = await localDal.getHabits();
    const activeHabits = habits.filter((h) => !h.archived);

    const todayStr = getClientDateString();
    const [y, m, d] = (weekStart || todayStr).split("-").map(Number);
    const today = new Date(Date.UTC(y, m - 1, d));
    const day = today.getUTCDay();
    const diff = today.getUTCDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today);
    monday.setUTCDate(diff);

    const pad = (n: number) => String(n).padStart(2, "0");
    const weekStartStr = `${monday.getUTCFullYear()}-${pad(monday.getUTCMonth() + 1)}-${pad(monday.getUTCDate())}`;

    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    const weekEndStr = `${sunday.getUTCFullYear()}-${pad(sunday.getUTCMonth() + 1)}-${pad(sunday.getUTCDate())}`;

    const rawLogs = await db.select<SqliteRow[]>(
      "SELECT * FROM habit_logs WHERE date >= ? AND date <= ? AND deleted_at IS NULL",
      [weekStartStr, weekEndStr],
    );

    const habitsSummary = activeHabits.map((h) => {
      const hLogs = rawLogs.filter((l) => String(l.habit_id) === h.id);
      let target = 1;
      if (h.type === "water" && "dailyGoalMl" in h.config)
        target = Number(h.config.dailyGoalMl) || 2500;
      else if (h.type === "walking" && "dailyGoal" in h.config)
        target = Number(h.config.dailyGoal) || 10000;
      else if (h.type === "timed" && "dailyGoalMinutes" in h.config)
        target = Number(h.config.dailyGoalMinutes) || 30;
      else if (h.type === "prayer")
        target = Array.isArray((h.config as { prayers?: unknown[] }).prayers)
          ? (h.config as { prayers?: unknown[] }).prayers?.length || 5
          : 5;

      const completedDates = new Set<string>();
      const grouped = new Map<string, number>();
      for (const log of hLogs) {
        const d = String(log.date);
        grouped.set(d, (grouped.get(d) || 0) + (Number(log.value) || 1));
      }
      for (const [date, val] of grouped.entries()) {
        if (val >= target) completedDates.add(date);
      }

      const completionCount = completedDates.size;
      const targetCount = 7;
      const completionRate = targetCount > 0 ? completionCount / targetCount : 0;

      return {
        habitId: h.id,
        name: h.name,
        type: h.type,
        category: h.category,
        completionCount,
        targetCount,
        completionRate,
      };
    });

    const dailyBreakdown = [];
    for (let i = 0; i < 7; i++) {
      const cur = new Date(monday);
      cur.setUTCDate(monday.getUTCDate() + i);
      const curStr = `${cur.getUTCFullYear()}-${pad(cur.getUTCMonth() + 1)}-${pad(cur.getUTCDate())}`;

      let dayCompletions = 0;
      for (const h of activeHabits) {
        let target = 1;
        if (h.type === "water" && "dailyGoalMl" in h.config)
          target = Number(h.config.dailyGoalMl) || 2500;
        else if (h.type === "walking" && "dailyGoal" in h.config)
          target = Number(h.config.dailyGoal) || 10000;
        else if (h.type === "timed" && "dailyGoalMinutes" in h.config)
          target = Number(h.config.dailyGoalMinutes) || 30;
        else if (h.type === "prayer")
          target = Array.isArray((h.config as { prayers?: unknown[] }).prayers)
            ? (h.config as { prayers?: unknown[] }).prayers?.length || 5
            : 5;

        const curLogs = rawLogs.filter(
          (l) => String(l.habit_id) === h.id && String(l.date) === curStr,
        );
        const dayVal = curLogs.reduce((sum, l) => sum + (Number(l.value) || 1), 0);
        if (dayVal >= target && target > 0) dayCompletions++;
      }

      dailyBreakdown.push({
        date: curStr,
        completions: dayCompletions,
      });
    }

    const topHabits = [...habitsSummary]
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 3);
    const totalPossible = habitsSummary.reduce((sum, h) => sum + h.targetCount, 0);
    const totalCompleted = habitsSummary.reduce((sum, h) => sum + h.completionCount, 0);
    const overallCompletionRate = totalPossible > 0 ? totalCompleted / totalPossible : 0;

    return {
      habits: habitsSummary,
      dailyBreakdown,
      topHabits,
      overallCompletionRate,
    };
  },

  // --- Skills ---
  getSkillAreas: async (): Promise<SkillArea[]> => {
    const db = await getLocalDb();
    const rows = await db.select<SqliteRow[]>("SELECT * FROM skill_areas WHERE deleted_at IS NULL");
    return rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      weeklyGoalHours: Number(r.weekly_goal_hours),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));
  },

  createSkillArea: async (input: NewSkillAreaInput): Promise<SkillArea> => {
    const db = await getLocalDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const area: SkillArea = {
      id,
      name: input.name,
      weeklyGoalHours: input.weeklyGoalHours ?? 5,
      createdAt: now,
      updatedAt: now,
    };

    await db.execute(
      `INSERT INTO skill_areas (id, user_id, name, category, color, icon, target_hours, weekly_goal_hours, created_at, updated_at, _sync_status)
       VALUES (?, '', ?, 'general', null, null, 100, ?, ?, ?, 'pending')`,
      [area.id, area.name, area.weeklyGoalHours, now, now],
    );

    return area;
  },

  updateSkillArea: async (id: string, patch: UpdateSkillAreaInput): Promise<SkillArea> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE skill_areas SET name = coalesce(?, name), updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [patch.name ?? null, now, id],
    );
    const found = (await localDal.getSkillAreas()).find((a) => a.id === id);
    if (!found) throw new Error("Skill area not found");
    return found;
  },

  deleteSkillArea: async (id: string): Promise<void> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE skill_areas SET deleted_at = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [now, now, id],
    );
  },

  getSkillAreaSummary: async (areaId: string): Promise<SkillAreaSummary> => {
    const areas = await localDal.getSkillAreas();
    const area = areas.find((a) => a.id === areaId);
    if (!area) throw new Error("Area not found");
    return {
      skillArea: area,
      totalResources: 0,
      totalMinutesSpent: 0,
      totalSessions: 0,
    };
  },

  getLearningResources: async (): Promise<LearningResource[]> => {
    const db = await getLocalDb();
    const rows = await db.select<SqliteRow[]>(
      "SELECT * FROM learning_resources WHERE deleted_at IS NULL",
    );
    return rows.map((r) => ({
      id: String(r.id),
      skillAreaId: String(r.skill_area_id),
      title: String(r.title),
      type: r.type as LearningResource["type"],
      totalUnits: typeof r.total_units === "number" ? r.total_units : undefined,
      unit: r.unit ? (r.unit as LearningUnit) : undefined,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));
  },

  getResourcesByArea: async (areaId: string): Promise<LearningResource[]> => {
    const all = await localDal.getLearningResources();
    return all.filter((r) => r.skillAreaId === areaId);
  },

  createLearningResource: async (input: NewLearningResourceInput): Promise<LearningResource> => {
    const db = await getLocalDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const resource: LearningResource = {
      id,
      skillAreaId: input.skillAreaId,
      title: input.title,
      type: input.type,
      totalUnits: input.totalUnits,
      unit: input.unit,
      createdAt: now,
      updatedAt: now,
    };

    await db.execute(
      `INSERT INTO learning_resources (id, skill_area_id, title, type, total_units, unit, created_at, updated_at, _sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        resource.id,
        resource.skillAreaId,
        resource.title,
        resource.type,
        resource.totalUnits ?? null,
        resource.unit ?? null,
        now,
        now,
      ],
    );

    return resource;
  },

  updateLearningResource: async (
    id: string,
    patch: UpdateLearningResourceInput,
  ): Promise<LearningResource> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE learning_resources SET title = coalesce(?, title), updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [patch.title ?? null, now, id],
    );
    const found = (await localDal.getLearningResources()).find((r) => r.id === id);
    if (!found) throw new Error("Resource not found");
    return found;
  },

  deleteLearningResource: async (id: string): Promise<void> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE learning_resources SET deleted_at = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [now, now, id],
    );
  },

  getResourceProgress: async (id: string): Promise<ResourceWithProgress> => {
    const resources = await localDal.getLearningResources();
    const resource = resources.find((r) => r.id === id);
    if (!resource) throw new Error("Resource not found");
    const db = await getLocalDb();
    const logs = await db.select<SqliteRow[]>(
      "SELECT * FROM learning_logs WHERE resource_id = ? AND deleted_at IS NULL",
      [id],
    );
    const totalMinutesSpent = logs.reduce((sum, l) => sum + (Number(l.minutes_spent) || 0), 0);
    const totalUnitsCompleted = logs.reduce((sum, l) => sum + (Number(l.units_completed) || 0), 0);

    return {
      ...resource,
      totalMinutesSpent,
      totalUnitsCompleted,
      completionPercent: resource.totalUnits
        ? Math.round((totalUnitsCompleted / resource.totalUnits) * 100)
        : 0,
      skillAreaName: "",
    };
  },

  logLearningSession: async (input: NewLearningLogInput): Promise<LearningLog> => {
    const db = await getLocalDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const log: LearningLog = {
      id,
      resourceId: input.resourceId,
      date: input.date,
      minutesSpent: input.minutesSpent,
      unitsCompleted: input.unitsCompleted,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };

    await db.execute(
      `INSERT INTO learning_logs (id, user_id, resource_id, date, minutes_spent, units_completed, notes, created_at, updated_at, _sync_status)
       VALUES (?, '', ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        log.id,
        log.resourceId,
        log.date,
        log.minutesSpent,
        log.unitsCompleted ?? null,
        log.notes ?? null,
        now,
        now,
      ],
    );

    return log;
  },

  updateLearningLog: async (id: string, patch: UpdateLearningLogInput): Promise<LearningLog> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE learning_logs SET minutes_spent = coalesce(?, minutes_spent), updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [patch.minutesSpent ?? null, now, id],
    );
    const all = await localDal.getLearningLogsByRange("2000-01-01", "2099-12-31");
    const found = all.find((l) => l.id === id);
    if (!found) throw new Error("Log not found");
    return found;
  },

  deleteLearningLog: async (id: string): Promise<void> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE learning_logs SET deleted_at = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [now, now, id],
    );
  },

  getLearningLogsByResource: async (resourceId: string): Promise<LearningLog[]> => {
    const db = await getLocalDb();
    const rows = await db.select<SqliteRow[]>(
      "SELECT * FROM learning_logs WHERE resource_id = ? AND deleted_at IS NULL ORDER BY date DESC",
      [resourceId],
    );
    return rows.map((r) => ({
      id: String(r.id),
      resourceId: String(r.resource_id),
      date: String(r.date),
      minutesSpent: Number(r.minutes_spent),
      unitsCompleted: typeof r.units_completed === "number" ? r.units_completed : undefined,
      notes: r.notes ? String(r.notes) : undefined,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));
  },

  getLearningLogsByRange: async (startDate: string, endDate: string): Promise<LearningLog[]> => {
    const db = await getLocalDb();
    const rows = await db.select<SqliteRow[]>(
      "SELECT * FROM learning_logs WHERE date >= ? AND date <= ? AND deleted_at IS NULL ORDER BY date DESC",
      [startDate, endDate],
    );
    return rows.map((r) => ({
      id: String(r.id),
      resourceId: String(r.resource_id),
      date: String(r.date),
      minutesSpent: Number(r.minutes_spent),
      unitsCompleted: typeof r.units_completed === "number" ? r.units_completed : undefined,
      notes: r.notes ? String(r.notes) : undefined,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));
  },

  getProgressBatch: async (resourceIds: string[]): Promise<ResourceWithProgress[]> => {
    return Promise.all(resourceIds.map((id) => localDal.getResourceProgress(id)));
  },

  // --- Finance ---
  getAccounts: async (): Promise<AccountWithBalance[]> => {
    const db = await getLocalDb();
    const accounts = await db.select<SqliteRow[]>(
      "SELECT * FROM accounts WHERE deleted_at IS NULL",
    );
    const result: AccountWithBalance[] = [];

    for (const a of accounts) {
      const txs = await db.select<SqliteRow[]>(
        "SELECT amount_minor FROM transactions WHERE account_id = ? AND deleted_at IS NULL",
        [a.id],
      );
      const balance = txs.reduce((sum, t) => sum + (Number(t.amount_minor) || 0), 0);
      result.push({
        id: String(a.id),
        name: String(a.name),
        type: a.type as AccountType,
        archived: Boolean(a.archived),
        balance,
        createdAt: String(a.created_at),
        updatedAt: String(a.updated_at),
      });
    }

    return result;
  },

  createAccount: async (input: NewAccountInput): Promise<Account> => {
    const db = await getLocalDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const account: Account = {
      id,
      name: input.name,
      type: input.type,
      archived: false,
      createdAt: now,
      updatedAt: now,
    };

    await db.execute(
      `INSERT INTO accounts (id, user_id, name, type, archived, created_at, updated_at, _sync_status)
       VALUES (?, '', ?, ?, 0, ?, ?, 'pending')`,
      [account.id, account.name, account.type, now, now],
    );

    return account;
  },

  getCategories: async (): Promise<Category[]> => {
    const db = await getLocalDb();
    const rows = await db.select<SqliteRow[]>("SELECT * FROM categories WHERE deleted_at IS NULL");
    return rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      kind: r.kind as CategoryKind,
      archived: Boolean(r.archived),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));
  },

  createCategory: async (input: NewCategoryInput): Promise<Category> => {
    const db = await getLocalDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const category: Category = {
      id,
      name: input.name,
      kind: input.kind,
      archived: false,
      createdAt: now,
      updatedAt: now,
    };

    await db.execute(
      `INSERT INTO categories (id, name, kind, archived, created_at, updated_at, _sync_status)
       VALUES (?, ?, ?, 0, ?, ?, 'pending')`,
      [category.id, category.name, category.kind, now, now],
    );

    return category;
  },

  getTransactions: async (accountId?: string): Promise<Transaction[]> => {
    const db = await getLocalDb();
    let sql = "SELECT * FROM transactions WHERE deleted_at IS NULL";
    const args: unknown[] = [];

    if (accountId) {
      sql += " AND account_id = ?";
      args.push(accountId);
    }
    sql += " ORDER BY date DESC";

    const rows = await db.select<SqliteRow[]>(sql, args);
    return rows.map((r) => ({
      id: String(r.id),
      accountId: String(r.account_id),
      categoryId: String(r.category_id),
      date: String(r.date),
      amountMinor: Number(r.amount_minor),
      currency: String(r.currency || "BDT"),
      note: r.note ? String(r.note) : undefined,
      transferPairId: r.transfer_pair_id ? String(r.transfer_pair_id) : undefined,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));
  },

  createTransaction: async (input: NewTransactionInput): Promise<Transaction> => {
    const db = await getLocalDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const tx: Transaction = {
      id,
      accountId: input.accountId,
      categoryId: input.categoryId,
      date: input.date,
      amountMinor: input.amountMinor,
      currency: input.currency ?? "BDT",
      note: input.note,
      transferPairId: input.transferPairId,
      createdAt: now,
      updatedAt: now,
    };

    await db.execute(
      `INSERT INTO transactions (id, user_id, account_id, category_id, date, amount_minor, currency, note, transfer_pair_id, created_at, updated_at, _sync_status)
       VALUES (?, '', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        tx.id,
        tx.accountId,
        tx.categoryId,
        tx.date,
        tx.amountMinor,
        tx.currency,
        tx.note ?? null,
        tx.transferPairId ?? null,
        now,
        now,
      ],
    );

    return tx;
  },

  getMonthlySummary: async (yearMonth: string): Promise<MonthlySummary> => {
    const db = await getLocalDb();
    const rows = await db.select<SqliteRow[]>(
      `SELECT t.amount_minor, c.kind FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.date LIKE ? AND t.deleted_at IS NULL`,
      [`${yearMonth}%`],
    );

    let totalIncome = 0;
    let totalExpense = 0;
    for (const r of rows) {
      const amount = Number(r.amount_minor) || 0;
      if (r.kind === "income") totalIncome += amount;
      else if (r.kind === "expense") totalExpense += amount;
    }

    return {
      yearMonth,
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
    };
  },

  getCategoryBreakdown: async (yearMonth: string): Promise<CategoryBreakdown[]> => {
    const db = await getLocalDb();
    const rows = await db.select<SqliteRow[]>(
      `SELECT c.id as categoryId, c.name as categoryName, c.kind, SUM(t.amount_minor) as total
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.date LIKE ? AND t.deleted_at IS NULL
       GROUP BY c.id`,
      [`${yearMonth}%`],
    );
    return rows.map((r) => ({
      categoryId: String(r.categoryId),
      categoryName: String(r.categoryName),
      kind: r.kind as CategoryKind,
      total: Number(r.total) || 0,
    }));
  },

  getFinanceWidget: async (): Promise<FinanceDashboardWidget> => {
    const now = new Date().toISOString().split("T")[0].substring(0, 7);
    const summary = await localDal.getMonthlySummary(now);
    const topExpenses = await localDal.getCategoryBreakdown(now);

    return {
      summary,
      topExpenses: topExpenses.filter((e) => e.kind === "expense"),
    };
  },

  // --- Dashboard Summary ---
  getSummary: async (date?: string): Promise<DashboardSummary> => {
    const db = await getLocalDb();
    const pad = (n: number) => String(n).padStart(2, "0");
    const today = date || new Date().toISOString().split("T")[0];
    const tasks = await localDal.getTasks(today);
    const habits = await localDal.getTodayHabits();
    const reminders = await localDal.getTodayReminders();

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const timeToMins = (t: string) => {
      const [h, m] = (t || "00:00").split(":").map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const sortedTasks = [...tasks].sort(
      (a, b) => timeToMins(a.startTime) - timeToMins(b.startTime),
    );

    const inProgressTask = sortedTasks.find((t) => t.status === "in_progress");

    let timeActiveTask: import("@lifeos/contracts").Task | null = null;
    for (const task of sortedTasks) {
      if (task.status === "done" || task.status === "cancelled" || task.status === "skipped")
        continue;
      const start = timeToMins(task.startTime);
      const end = timeToMins(task.endTime);
      const isOvernight = task.isOvernight || start >= end;
      const isActive = isOvernight
        ? currentMinutes >= start || currentMinutes < end
        : currentMinutes >= start && currentMinutes < end;
      if (isActive) {
        timeActiveTask = task;
        break;
      }
    }

    const nowTask = inProgressTask || timeActiveTask || null;

    let nextTask: import("@lifeos/contracts").Task | null = null;
    for (const task of sortedTasks) {
      if (task.status === "done" || task.status === "cancelled" || task.status === "skipped")
        continue;
      if (nowTask && task.id === nowTask.id) continue;
      const start = timeToMins(task.startTime);
      if (start >= currentMinutes) {
        nextTask = task;
        break;
      }
    }

    let previousTask: import("@lifeos/contracts").Task | null = null;
    const candidatePreviousTasks = sortedTasks.filter((t) => {
      if (nowTask && t.id === nowTask.id) return false;
      if (nextTask && t.id === nextTask.id) return false;
      const start = timeToMins(t.startTime);
      const end = timeToMins(t.endTime);
      const isOvernight = t.isOvernight || start >= end;

      if (t.status === "done" || t.status === "skipped") return true;
      if (isOvernight) {
        return currentMinutes >= end && currentMinutes < start;
      }
      return end <= currentMinutes || start <= currentMinutes;
    });

    if (candidatePreviousTasks.length > 0) {
      candidatePreviousTasks.sort((a, b) => {
        const endA = timeToMins(a.endTime);
        const endB = timeToMins(b.endTime);
        const endedPastA = endA <= currentMinutes;
        const endedPastB = endB <= currentMinutes;

        if (endedPastA && endedPastB) {
          return endA - endB;
        }
        if (endedPastA && !endedPastB) {
          if (b.status === "done" && b.updatedAt && a.updatedAt) {
            return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          }
          return 1;
        }
        if (!endedPastA && endedPastB) {
          if (a.status === "done" && a.updatedAt && b.updatedAt) {
            return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          }
          return -1;
        }

        if (a.updatedAt && b.updatedAt) {
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        }
        return endA - endB;
      });

      previousTask = candidatePreviousTasks[candidatePreviousTasks.length - 1];
    }

    const completedTasks = tasks.filter((t) => t.status === "done");

    const consistencyHabits = habits.slice(0, 4);
    const habitConsistency: DashboardHabitConsistency[] = [];

    const [curY, curM, curD] = today.split("-").map(Number);
    const end7 = new Date(Date.UTC(curY, curM - 1, curD));
    const start7 = new Date(end7);
    start7.setUTCDate(start7.getUTCDate() - 6);
    const start7Str = `${start7.getUTCFullYear()}-${pad(start7.getUTCMonth() + 1)}-${pad(start7.getUTCDate())}`;

    for (const h of consistencyHabits) {
      const hRawLogs = await db.select<SqliteRow[]>(
        "SELECT * FROM habit_logs WHERE habit_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL",
        [h.id, start7Str, today],
      );
      let target = 1;
      if (h.type === "water" && "dailyGoalMl" in h.config)
        target = Number(h.config.dailyGoalMl) || 2500;
      else if (h.type === "walking" && "dailyGoal" in h.config)
        target = Number(h.config.dailyGoal) || 10000;
      else if (h.type === "timed" && "dailyGoalMinutes" in h.config)
        target = Number(h.config.dailyGoalMinutes) || 30;
      else if (h.type === "prayer")
        target = Array.isArray((h.config as { prayers?: unknown[] }).prayers)
          ? (h.config as { prayers?: unknown[] }).prayers?.length || 5
          : 5;

      const grouped = new Map<string, number>();
      for (const log of hRawLogs) {
        const d = String(log.date);
        grouped.set(d, (grouped.get(d) || 0) + (Number(log.value) || 1));
      }

      const days: number[] = [];
      for (let i = 0; i < 7; i++) {
        const cur = new Date(start7);
        cur.setUTCDate(start7.getUTCDate() + i);
        const dStr = `${cur.getUTCFullYear()}-${pad(cur.getUTCMonth() + 1)}-${pad(cur.getUTCDate())}`;
        const val = grouped.get(dStr) || 0;
        const pct = target > 0 ? Math.min(100, Math.round((val / target) * 100)) : 0;
        days.push(pct);
      }

      const weekAvg = Math.round(days.reduce((a, b) => a + b, 0) / 7);

      habitConsistency.push({
        habitId: h.id,
        name: h.name,
        color: h.color || "#10B981",
        days,
        currentStreak: h.currentStreak,
        weekAverage: weekAvg,
      });
    }

    return {
      now: nowTask,
      next: nextTask,
      todayCount: tasks.length,
      todayDoneCount: completedTasks.length,
      dueHabits: habits,
      previous: previousTask,
      upcomingReminders: reminders,
      habitConsistency,
      workoutWeek: [],
      workoutLabels: [],
      skillsProgress: [],
      newsItems: [],
    };
  },

  // --- Reminders & Notifications ---
  getReminders: async (date?: string): Promise<Reminder[]> => {
    const db = await getLocalDb();
    let sql = "SELECT * FROM reminders WHERE deleted_at IS NULL";
    const args: unknown[] = [];
    if (date) {
      sql += " AND date = ?";
      args.push(date);
    }
    sql += " ORDER BY time ASC";

    const rows = await db.select<SqliteRow[]>(sql, args);
    return rows.map((r) => ({
      id: String(r.id),
      title: String(r.title),
      time: String(r.time),
      date: r.date ? String(r.date) : null,
      kind: (r.kind as Reminder["kind"]) || "reminder",
      completed: Boolean(r.completed),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));
  },

  getTodayReminders: async (): Promise<Reminder[]> => {
    const today = new Date().toISOString().split("T")[0];
    return localDal.getReminders(today);
  },

  createReminder: async (input: NewReminderInput): Promise<Reminder> => {
    const db = await getLocalDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const reminder: Reminder = {
      id,
      title: input.title,
      time: input.time,
      date: input.date ?? null,
      kind: input.kind ?? "reminder",
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    await db.execute(
      `INSERT INTO reminders (id, user_id, title, time, date, kind, completed, created_at, updated_at, _sync_status)
       VALUES (?, '', ?, ?, ?, ?, 0, ?, ?, 'pending')`,
      [reminder.id, reminder.title, reminder.time, reminder.date ?? null, reminder.kind, now, now],
    );

    return reminder;
  },

  updateReminder: async (id: string, patch: UpdateReminderInput): Promise<Reminder> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    const comp = patch.completed !== undefined ? (patch.completed ? 1 : 0) : null;
    await db.execute(
      "UPDATE reminders SET completed = coalesce(?, completed), updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [comp, now, id],
    );
    const all = await localDal.getReminders();
    const found = all.find((r) => r.id === id);
    if (!found) throw new Error("Reminder not found");
    return found;
  },

  deleteReminder: async (id: string): Promise<void> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE reminders SET deleted_at = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [now, now, id],
    );
  },

  getNotifications: async (): Promise<NotificationWithTask[]> => {
    const db = await getLocalDb();
    const rows = await db.select<SqliteRow[]>(
      "SELECT * FROM notifications WHERE deleted_at IS NULL ORDER BY reminder_time DESC",
    );
    return rows.map((r) => ({
      id: String(r.id),
      taskId: String(r.task_id),
      userId: String(r.user_id || ""),
      reminderTime: String(r.reminder_time),
      soundType: r.sound_type as NotificationWithTask["soundType"],
      status: r.status as NotificationWithTask["status"],
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
      taskTitle: "",
      taskDate: "",
      taskStartTime: "",
    }));
  },

  getDueNotifications: async (): Promise<NotificationWithTask[]> => {
    const all = await localDal.getNotifications();
    const now = new Date().toISOString();
    return all.filter((n) => n.reminderTime <= now && n.status === "scheduled");
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const due = await localDal.getDueNotifications();
    return { count: due.length };
  },

  createNotification: async (input: NewNotificationInput): Promise<Notification> => {
    const db = await getLocalDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const notif: Notification = {
      id,
      taskId: input.taskId,
      userId: input.userId || "",
      reminderTime: input.reminderTime,
      soundType: input.soundType ?? "default",
      status: "scheduled",
      createdAt: now,
      updatedAt: now,
    };

    await db.execute(
      `INSERT INTO notifications (id, task_id, user_id, reminder_time, sound_type, status, created_at, updated_at, _sync_status)
       VALUES (?, ?, ?, ?, ?, 'scheduled', ?, ?, 'pending')`,
      [notif.id, notif.taskId, notif.userId, notif.reminderTime, notif.soundType, now, now],
    );

    return notif;
  },

  deleteNotification: async (id: string): Promise<void> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE notifications SET deleted_at = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [now, now, id],
    );
  },

  deleteNotificationsByTaskId: async (taskId: string): Promise<void> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE notifications SET deleted_at = ?, updated_at = ?, _sync_status = 'pending' WHERE task_id = ?",
      [now, now, taskId],
    );
  },

  getSoundSettings: async (): Promise<{ soundType: NotificationSoundType }> => {
    const settings = await localDal.getSettings();
    return { soundType: (settings.default_sound as NotificationSoundType) || "default" };
  },

  updateSoundSettings: async (
    soundType: NotificationSoundType,
  ): Promise<{ soundType: NotificationSoundType }> => {
    await localDal.updateSettings({ default_sound: soundType });
    return { soundType };
  },

  // --- Profile & System ---
  updateProfile: async (input: { name?: string; email?: string }) => {
    const raw = localStorage.getItem("lifeos_session_user");
    let user = { id: "", name: "", email: "" };
    if (raw) {
      try {
        user = JSON.parse(raw);
      } catch {}
    }
    if (input.name) user.name = input.name;
    if (input.email) user.email = input.email;
    localStorage.setItem("lifeos_session_user", JSON.stringify(user));
    return { user };
  },

  getSettings: async (): Promise<Record<string, string>> => {
    const db = await getLocalDb();
    const rows = await db.select<SqliteRow[]>("SELECT key, value FROM settings");
    const result: Record<string, string> = {};
    for (const r of rows) {
      result[String(r.key)] = String(r.value);
    }
    return result;
  },

  updateSettings: async (settings: Record<string, string>): Promise<Record<string, string>> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();

    for (const [k, v] of Object.entries(settings)) {
      await db.execute(
        `INSERT INTO settings (key, value, updated_at, _sync_status) VALUES (?, ?, ?, 'pending')
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, _sync_status = 'pending'`,
        [k, String(v), now],
      );
    }

    return localDal.getSettings();
  },

  getHealth: async (): Promise<{ status: string; timestamp: string; version?: string }> => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "0.1.0",
    };
  },
};
