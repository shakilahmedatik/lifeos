import {
  type Account,
  type AccountType,
  type AccountWithBalance,
  type Category,
  type CategoryBreakdown,
  type CategoryKind,
  type DashboardHabitConsistency,
  type DashboardNewsItem,
  type DashboardSkillProgress,
  type DashboardSummary,
  type DashboardWorkoutDay,
  DEFAULT_FINANCE_CATEGORIES,
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
  type NewRoutineCategoryInput,
  type NewSkillAreaInput,
  type NewTaskInput,
  type NewTransactionInput,
  type Notification,
  type NotificationSoundType,
  type NotificationWithTask,
  type Reminder,
  RESERVED_CATEGORY_NAMES,
  type ResourceWithProgress,
  type RoutineCategory,
  type RoutineStats,
  type SkillArea,
  type SkillAreaSummary,
  SYSTEM_CATEGORY_TRANSFER_IN_ID,
  SYSTEM_CATEGORY_TRANSFER_OUT_ID,
  type Task,
  type TaskCategory,
  type TaskHistoryQuery,
  type TaskStatus,
  type Transaction,
  type UpdateLearningLogInput,
  type UpdateLearningResourceInput,
  type UpdateReminderInput,
  type UpdateRoutineCategoryInput,
  type UpdateSkillAreaInput,
  type WeeklySummary,
} from "@lifeos/contracts";
import { getLocalDb } from "./index.js";

type SqliteRow = Record<string, unknown>;

let _cachedNewsItems: DashboardNewsItem[] = [];
let _lastNewsFetchTime = 0;

async function getDashboardNewsItems(): Promise<DashboardNewsItem[]> {
  const now = Date.now();
  if (_cachedNewsItems.length > 0 && now - _lastNewsFetchTime < 5 * 60 * 1000) {
    return _cachedNewsItems;
  }

  // 1. Try fetching ticker articles from backend API
  try {
    const { fetchTickerArticles } = await import("../../modules/news/api.js");
    const articles = await fetchTickerArticles();
    if (Array.isArray(articles) && articles.length > 0) {
      _cachedNewsItems = articles.slice(0, 5).map((a) => ({
        id: a.id,
        source: ((a as { feedTitle?: string }).feedTitle || "tech")
          .toLowerCase()
          .split(" ")[0]
          .slice(0, 10),
        title: a.title,
        url: a.url,
        publishedAt: a.publishedAt || null,
      }));
      _lastNewsFetchTime = now;
      return _cachedNewsItems;
    }
  } catch {
    // backend API not available or no articles
  }

  // 2. Fallback to public Hacker News Top Stories API (works directly in browser/Tauri without CORS)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json", {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const ids: number[] = await res.json();
      const top5Ids = ids.slice(0, 5);
      const articlePromises = top5Ids.map(async (id) => {
        try {
          const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          if (itemRes.ok) {
            const item = await itemRes.json();
            if (item?.title) {
              return {
                id: String(item.id),
                source: "hn",
                title: String(item.title),
                url: String(item.url || `https://news.ycombinator.com/item?id=${item.id}`),
                publishedAt: item.time ? new Date(item.time * 1000).toISOString() : null,
              } as DashboardNewsItem;
            }
          }
        } catch {
          return null;
        }
        return null;
      });

      const fetched = (await Promise.all(articlePromises)).filter(
        (a): a is DashboardNewsItem => a !== null,
      );

      if (fetched.length > 0) {
        _cachedNewsItems = fetched;
        _lastNewsFetchTime = now;
        return _cachedNewsItems;
      }
    }
  } catch {
    // network unavailable / offline
  }

  return _cachedNewsItems;
}

async function ensureFinanceCategories(db: Awaited<ReturnType<typeof getLocalDb>>): Promise<void> {
  const now = new Date().toISOString();
  for (const cat of DEFAULT_FINANCE_CATEGORIES) {
    const rows = await db.select<SqliteRow[]>(
      "SELECT id, is_system FROM categories WHERE (id = ? OR lower(name) = lower(?)) AND deleted_at IS NULL",
      [cat.id, cat.name],
    );
    if (rows.length === 0) {
      await db.execute(
        `INSERT OR IGNORE INTO categories (id, name, kind, is_system, archived, created_at, updated_at, _sync_status)
         VALUES (?, ?, ?, 1, 0, ?, ?, 'synced')`,
        [cat.id, cat.name, cat.kind, now, now],
      );
    } else if (!rows[0].is_system) {
      await db.execute("UPDATE categories SET is_system = 1, updated_at = ? WHERE id = ?", [
        now,
        rows[0].id,
      ]);
    }
  }
}

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
      `INSERT INTO tasks (id, user_id, title, category, date, start_time, end_time, status, notes, reminder_minutes_before, reminder_silent, reminder_sound, recurrence, subtasks, reference_id, created_at, updated_at, _sync_status)
       VALUES (?, '', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
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
        task.reminderSilent ? 1 : 0,
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
      notes:
        patch.notes !== undefined
          ? patch.notes
          : existing.notes
            ? String(existing.notes)
            : undefined,
      reminderMinutesBefore:
        patch.reminderMinutesBefore !== undefined
          ? patch.reminderMinutesBefore
          : typeof existing.reminder_minutes_before === "number"
            ? existing.reminder_minutes_before
            : null,
      reminderSilent:
        patch.reminderSilent !== undefined
          ? patch.reminderSilent
            ? 1
            : 0
          : Number(existing.reminder_silent || 0),
      reminderSound:
        patch.reminderSound !== undefined
          ? patch.reminderSound
          : (existing.reminder_sound as NotificationSoundType) || "default",
      recurrence:
        patch.recurrence !== undefined
          ? patch.recurrence
          : (existing.recurrence as Task["recurrence"]) || "none",
      referenceId:
        patch.referenceId !== undefined
          ? patch.referenceId
          : existing.reference_id
            ? String(existing.reference_id)
            : null,
      subtasks: patch.subtasks ? JSON.stringify(patch.subtasks) : String(existing.subtasks || "[]"),
      updated_at: now,
    };

    await db.execute(
      `UPDATE tasks SET title = ?, category = ?, date = ?, start_time = ?, end_time = ?, status = ?, notes = ?, reminder_minutes_before = ?, reminder_silent = ?, reminder_sound = ?, recurrence = ?, reference_id = ?, subtasks = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?`,
      [
        updated.title,
        updated.category,
        updated.date,
        updated.startTime,
        updated.endTime,
        updated.status,
        updated.notes ?? null,
        updated.reminderMinutesBefore,
        updated.reminderSilent,
        updated.reminderSound,
        updated.recurrence,
        updated.referenceId,
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
      reminderMinutesBefore: updated.reminderMinutesBefore ?? undefined,
      reminderSilent: Boolean(updated.reminderSilent),
      reminderSound: updated.reminderSound,
      recurrence: updated.recurrence,
      referenceId: updated.referenceId ?? undefined,
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

  getRoutineCategories: async (): Promise<RoutineCategory[]> => {
    const db = await getLocalDb();
    const countRes = await db.select<{ count: number }[]>(
      "SELECT COUNT(*) as count FROM routine_categories WHERE deleted_at IS NULL",
    );
    if ((countRes[0]?.count || 0) === 0) {
      const now = new Date().toISOString();
      const defaults = [
        { id: "routine", name: "Routine", color: "#14b8a6", icon: "Clock", sortOrder: 0 },
        { id: "must_do", name: "Must Do", color: "#dc2626", icon: "AlertCircle", sortOrder: 1 },
        { id: "work", name: "Work", color: "#3b82f6", icon: "Briefcase", sortOrder: 2 },
        { id: "workout", name: "Workout", color: "#ef4444", icon: "Dumbbell", sortOrder: 3 },
        { id: "learning", name: "Learning", color: "#a855f7", icon: "BookOpen", sortOrder: 4 },
        { id: "habit", name: "Habit", color: "#f97316", icon: "Flame", sortOrder: 5 },
        { id: "personal", name: "Personal", color: "#ec4899", icon: "User", sortOrder: 6 },
        { id: "flex", name: "Flex", color: "#6366f1", icon: "Shuffle", sortOrder: 7 },
        { id: "general", name: "General", color: "#6b7280", icon: "CheckSquare", sortOrder: 8 },
      ];
      for (const d of defaults) {
        await db.execute(
          `INSERT OR IGNORE INTO routine_categories (id, user_id, name, color, icon, is_default, sort_order, created_at, updated_at, _sync_status)
           VALUES (?, '', ?, ?, ?, 1, ?, ?, ?, 'synced')`,
          [d.id, d.name, d.color, d.icon, d.sortOrder, now, now],
        );
      }
    }

    const rows = await db.select<SqliteRow[]>(
      "SELECT * FROM routine_categories WHERE deleted_at IS NULL ORDER BY sort_order ASC, created_at ASC",
    );
    return rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      color: String(r.color),
      icon: r.icon ? String(r.icon) : undefined,
      isDefault: Boolean(r.is_default),
      sortOrder: Number(r.sort_order),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));
  },

  createRoutineCategory: async (input: NewRoutineCategoryInput): Promise<RoutineCategory> => {
    const db = await getLocalDb();
    const id = `rcat_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const color = input.color || "#3b82f6";
    const sortOrder = input.sortOrder ?? 100;

    await db.execute(
      `INSERT INTO routine_categories (id, user_id, name, color, icon, is_default, sort_order, created_at, updated_at, _sync_status)
       VALUES (?, '', ?, ?, ?, 0, ?, ?, ?, 'pending')`,
      [id, input.name.trim(), color, input.icon || null, sortOrder, now, now],
    );

    return {
      id,
      name: input.name.trim(),
      color,
      icon: input.icon || undefined,
      isDefault: false,
      sortOrder,
      createdAt: now,
      updatedAt: now,
    };
  },

  updateRoutineCategory: async (
    id: string,
    patch: UpdateRoutineCategoryInput,
  ): Promise<RoutineCategory> => {
    const db = await getLocalDb();
    const existing = (
      await db.select<SqliteRow[]>("SELECT * FROM routine_categories WHERE id = ?", [id])
    )[0];
    if (!existing) throw new Error(`Routine category ${id} not found`);

    const updated = {
      name: patch.name ? patch.name.trim() : String(existing.name),
      color: patch.color ? patch.color.trim() : String(existing.color),
      icon: patch.icon !== undefined ? patch.icon || null : (existing.icon as string | null),
      sort_order: patch.sortOrder !== undefined ? patch.sortOrder : Number(existing.sort_order),
      updated_at: new Date().toISOString(),
    };

    await db.execute(
      `UPDATE routine_categories SET name = ?, color = ?, icon = ?, sort_order = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?`,
      [updated.name, updated.color, updated.icon, updated.sort_order, updated.updated_at, id],
    );

    return {
      id,
      name: updated.name,
      color: updated.color,
      icon: updated.icon ? String(updated.icon) : undefined,
      isDefault: Boolean(existing.is_default),
      sortOrder: updated.sort_order,
      createdAt: String(existing.created_at),
      updatedAt: updated.updated_at,
    };
  },

  deleteRoutineCategory: async (
    id: string,
    fallback = "general",
  ): Promise<{ success: boolean; reassignedCount: number }> => {
    const db = await getLocalDb();
    const existing = (
      await db.select<SqliteRow[]>("SELECT * FROM routine_categories WHERE id = ?", [id])
    )[0];
    if (!existing) throw new Error(`Routine category ${id} not found`);

    // Reassign tasks
    const catName = String(existing.name).toLowerCase();
    await db.execute(
      `UPDATE tasks SET category = ?, updated_at = ?, _sync_status = 'pending' 
       WHERE (category = ? OR lower(category) = ?) AND deleted_at IS NULL`,
      [fallback, new Date().toISOString(), id, catName],
    );

    await db.execute(
      "UPDATE routine_categories SET deleted_at = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [new Date().toISOString(), new Date().toISOString(), id],
    );

    return { success: true, reassignedCount: 0 };
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
    const logDate = date || getClientDateString();
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

  getHabitLogs: async (habitId: string, date: string): Promise<HabitLogEntry[]> => {
    const db = await getLocalDb();
    const rows = await db.select<SqliteRow[]>(
      "SELECT * FROM habit_logs WHERE habit_id = ? AND date = ? AND deleted_at IS NULL ORDER BY logged_at ASC",
      [habitId, date],
    );
    return rows.map((l) => ({
      id: String(l.id),
      habitId: String(l.habit_id),
      date: String(l.date),
      value: Number(l.value) || 1,
      meta: l.meta ? String(l.meta) : undefined,
      loggedAt: String(l.logged_at),
    }));
  },

  getTodayHabits: async (date?: string): Promise<HabitWithStreak[]> => {
    const habits = await localDal.getHabits();
    const today = date || getClientDateString();
    const db = await getLocalDb();

    const activeHabits = habits.filter((h) => !h.archived);
    const result: HabitWithStreak[] = [];

    for (const h of activeHabits) {
      const rows = await db.select<SqliteRow[]>(
        "SELECT * FROM habit_logs WHERE habit_id = ? AND date = ? AND deleted_at IS NULL ORDER BY logged_at ASC",
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

      let todayValue = logs.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
      if (h.type === "prayer") {
        todayValue = logs.length;
      } else if (h.type === "boolean") {
        todayValue = logs.length > 0 ? 1 : 0;
      }

      let todayTarget = 1;
      if (h.type === "water" && "dailyGoalMl" in h.config) {
        todayTarget = Number(h.config.dailyGoalMl) || 2500;
      } else if (h.type === "walking" && "dailyGoal" in h.config) {
        todayTarget = Number(h.config.dailyGoal) || 10000;
      } else if (h.type === "timed" && "dailyGoalMinutes" in h.config) {
        todayTarget = Number(h.config.dailyGoalMinutes) || 30;
      } else if (h.type === "prayer") {
        todayTarget = Array.isArray((h.config as { prayers?: unknown[] })?.prayers)
          ? (h.config as { prayers?: unknown[] })?.prayers?.length || 5
          : 5;
      }

      const todayProgress =
        todayTarget > 0 ? Math.min(1, todayValue / todayTarget) : todayValue > 0 ? 1 : 0;

      // Current streak: calculate consecutive days completed
      let streak = todayProgress >= 1 ? 1 : 0;
      try {
        const [y, m, d] = today.split("-").map(Number);
        for (let i = 1; i <= 365; i++) {
          const prevD = new Date(Date.UTC(y, m - 1, d - i));
          const pad = (n: number) => String(n).padStart(2, "0");
          const prevStr = `${prevD.getUTCFullYear()}-${pad(prevD.getUTCMonth() + 1)}-${pad(prevD.getUTCDate())}`;
          const prevLogs = await db.select<SqliteRow[]>(
            "SELECT * FROM habit_logs WHERE habit_id = ? AND date = ? AND deleted_at IS NULL",
            [h.id, prevStr],
          );
          let prevVal = prevLogs.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
          if (h.type === "prayer") prevVal = prevLogs.length;
          else if (h.type === "boolean") prevVal = prevLogs.length > 0 ? 1 : 0;
          if (prevVal >= todayTarget) {
            streak++;
          } else {
            break;
          }
        }
      } catch {
        // ignore
      }

      result.push({
        ...h,
        currentStreak: streak,
        longestStreak: Math.max(streak, 1),
        loggedToday: todayProgress >= 1,
        todayProgress,
        todayValue,
        todayTarget,
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
      "SELECT * FROM accounts WHERE deleted_at IS NULL ORDER BY name ASC",
    );
    const result: AccountWithBalance[] = [];

    for (const a of accounts) {
      const balance = await localDal.getAccountBalance(String(a.id));
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

  getActiveAccounts: async (): Promise<Account[]> => {
    const db = await getLocalDb();
    const rows = await db.select<SqliteRow[]>(
      "SELECT * FROM accounts WHERE deleted_at IS NULL AND archived = 0 ORDER BY name ASC",
    );
    return rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      type: r.type as AccountType,
      archived: false,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));
  },

  getAccount: async (id: string): Promise<Account | null> => {
    const db = await getLocalDb();
    const rows = await db.select<SqliteRow[]>(
      "SELECT * FROM accounts WHERE id = ? AND deleted_at IS NULL",
      [id],
    );
    if (!rows[0]) return null;
    const r = rows[0];
    return {
      id: String(r.id),
      name: String(r.name),
      type: r.type as AccountType,
      archived: Boolean(r.archived),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    };
  },

  getAccountBalance: async (id: string): Promise<number> => {
    const db = await getLocalDb();
    const rows = await db.select<SqliteRow[]>(
      `SELECT COALESCE(SUM(
         CASE
           WHEN c.kind = 'income' THEN t.amount_minor
           WHEN c.kind = 'expense' THEN -t.amount_minor
           ELSE 0
         END
       ), 0) as balance
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.account_id = ? AND t.deleted_at IS NULL`,
      [id],
    );
    return Number(rows[0]?.balance ?? 0);
  },

  getAccountBalances: async (): Promise<AccountWithBalance[]> => {
    return localDal.getAccounts();
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

  updateAccount: async (id: string, patch: Partial<NewAccountInput>): Promise<Account> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    const existing = await localDal.getAccount(id);
    if (!existing) throw new Error("Account not found");

    const name = patch.name ?? existing.name;
    const type = patch.type ?? existing.type;

    await db.execute(
      "UPDATE accounts SET name = ?, type = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [name, type, now, id],
    );

    return {
      ...existing,
      name,
      type,
      updatedAt: now,
    };
  },

  archiveAccount: async (id: string): Promise<void> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE accounts SET archived = 1, updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [now, id],
    );
  },

  unarchiveAccount: async (id: string): Promise<void> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE accounts SET archived = 0, updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [now, id],
    );
  },

  deleteAccount: async (id: string): Promise<void> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE accounts SET deleted_at = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [now, now, id],
    );
  },

  getCategories: async (): Promise<Category[]> => {
    const db = await getLocalDb();
    await ensureFinanceCategories(db);
    const rows = await db.select<SqliteRow[]>(
      "SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY is_system DESC, name ASC",
    );
    return rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      kind: r.kind as CategoryKind,
      isSystem: Boolean(r.is_system),
      archived: Boolean(r.archived),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));
  },

  getActiveCategories: async (): Promise<Category[]> => {
    const db = await getLocalDb();
    await ensureFinanceCategories(db);
    const rows = await db.select<SqliteRow[]>(
      "SELECT * FROM categories WHERE deleted_at IS NULL AND archived = 0 ORDER BY is_system DESC, name ASC",
    );
    return rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      kind: r.kind as CategoryKind,
      isSystem: Boolean(r.is_system),
      archived: false,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));
  },

  getIncomeCategories: async (): Promise<Category[]> => {
    const db = await getLocalDb();
    await ensureFinanceCategories(db);
    const rows = await db.select<SqliteRow[]>(
      "SELECT * FROM categories WHERE deleted_at IS NULL AND kind = 'income' AND archived = 0 ORDER BY is_system DESC, name ASC",
    );
    return rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      kind: "income",
      isSystem: Boolean(r.is_system),
      archived: false,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));
  },

  getExpenseCategories: async (): Promise<Category[]> => {
    const db = await getLocalDb();
    await ensureFinanceCategories(db);
    const rows = await db.select<SqliteRow[]>(
      "SELECT * FROM categories WHERE deleted_at IS NULL AND kind = 'expense' AND archived = 0 ORDER BY is_system DESC, name ASC",
    );
    return rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      kind: "expense",
      isSystem: Boolean(r.is_system),
      archived: false,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));
  },

  getCategory: async (id: string): Promise<Category | null> => {
    const db = await getLocalDb();
    const rows = await db.select<SqliteRow[]>(
      "SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL",
      [id],
    );
    if (!rows[0]) return null;
    const r = rows[0];
    return {
      id: String(r.id),
      name: String(r.name),
      kind: r.kind as CategoryKind,
      isSystem: Boolean(r.is_system),
      archived: Boolean(r.archived),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    };
  },

  createCategory: async (input: NewCategoryInput): Promise<Category> => {
    if (
      !input.isSystem &&
      RESERVED_CATEGORY_NAMES.some((n) => n.toLowerCase() === input.name.trim().toLowerCase())
    ) {
      throw new Error("Transfer In and Transfer Out are reserved system categories");
    }
    const db = await getLocalDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const isSystem = Boolean(input.isSystem);

    const category: Category = {
      id,
      name: input.name,
      kind: input.kind,
      isSystem,
      archived: false,
      createdAt: now,
      updatedAt: now,
    };

    await db.execute(
      `INSERT INTO categories (id, name, kind, is_system, archived, created_at, updated_at, _sync_status)
       VALUES (?, ?, ?, ?, 0, ?, ?, 'pending')`,
      [category.id, category.name, category.kind, isSystem ? 1 : 0, now, now],
    );

    return category;
  },

  updateCategory: async (id: string, patch: Partial<NewCategoryInput>): Promise<Category> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    const existing = await localDal.getCategory(id);
    if (!existing) throw new Error("Category not found");
    if (existing.isSystem) throw new Error("Cannot modify system category");
    if (
      patch.name &&
      RESERVED_CATEGORY_NAMES.some((n) => n.toLowerCase() === patch.name!.trim().toLowerCase())
    ) {
      throw new Error("Cannot rename to reserved system category name");
    }

    const name = patch.name ?? existing.name;
    const kind = patch.kind ?? existing.kind;

    await db.execute(
      "UPDATE categories SET name = ?, kind = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [name, kind, now, id],
    );

    return {
      ...existing,
      name,
      kind,
      updatedAt: now,
    };
  },

  archiveCategory: async (id: string): Promise<void> => {
    const existing = await localDal.getCategory(id);
    if (!existing) throw new Error("Category not found");
    if (existing.isSystem) throw new Error("Cannot archive system category");
    const db = await getLocalDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE categories SET archived = 1, updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [now, id],
    );
  },

  unarchiveCategory: async (id: string): Promise<void> => {
    const existing = await localDal.getCategory(id);
    if (!existing) throw new Error("Category not found");
    if (existing.isSystem) throw new Error("Cannot modify system category");
    const db = await getLocalDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE categories SET archived = 0, updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [now, id],
    );
  },

  deleteCategory: async (id: string): Promise<void> => {
    const existing = await localDal.getCategory(id);
    if (!existing) throw new Error("Category not found");
    if (existing.isSystem) throw new Error("Cannot delete system category");
    const db = await getLocalDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE categories SET deleted_at = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [now, now, id],
    );
  },

  getTransactions: async (accountId?: string): Promise<Transaction[]> => {
    const db = await getLocalDb();
    let sql = "SELECT * FROM transactions WHERE deleted_at IS NULL";
    const args: unknown[] = [];

    if (accountId) {
      sql += " AND account_id = ?";
      args.push(accountId);
    }
    sql += " ORDER BY date DESC, created_at DESC";

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

  getTransactionsByDateRange: async (
    startDate: string,
    endDate: string,
  ): Promise<Transaction[]> => {
    const db = await getLocalDb();
    const rows = await db.select<SqliteRow[]>(
      `SELECT * FROM transactions 
       WHERE deleted_at IS NULL 
         AND (
           substr(date, 1, 10) >= ? AND substr(date, 1, 10) <= ?
           OR (date >= ? AND (date <= ? OR date <= ? || 'T23:59:59.999Z' OR date <= ? || ' 23:59:59'))
         ) 
       ORDER BY date DESC, created_at DESC`,
      [startDate, endDate, startDate, endDate, endDate, endDate],
    );
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

  getTransactionsByAccount: async (accountId: string): Promise<Transaction[]> => {
    return localDal.getTransactions(accountId);
  },

  getTransaction: async (id: string): Promise<Transaction | null> => {
    const db = await getLocalDb();
    const rows = await db.select<SqliteRow[]>(
      "SELECT * FROM transactions WHERE id = ? AND deleted_at IS NULL",
      [id],
    );
    if (!rows[0]) return null;
    const r = rows[0];
    return {
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
    };
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

  updateTransaction: async (
    id: string,
    patch: Partial<NewTransactionInput>,
  ): Promise<Transaction> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    const existing = await localDal.getTransaction(id);
    if (!existing) throw new Error("Transaction not found");

    const accountId = patch.accountId ?? existing.accountId;
    const categoryId = patch.categoryId ?? existing.categoryId;
    const date = patch.date ?? existing.date;
    const amountMinor = patch.amountMinor ?? existing.amountMinor;
    const currency = patch.currency ?? existing.currency;
    const note = patch.note !== undefined ? patch.note : existing.note;
    const transferPairId =
      patch.transferPairId !== undefined ? patch.transferPairId : existing.transferPairId;

    await db.execute(
      `UPDATE transactions
       SET account_id = ?, category_id = ?, date = ?, amount_minor = ?, currency = ?, note = ?, transfer_pair_id = ?, updated_at = ?, _sync_status = 'pending'
       WHERE id = ?`,
      [
        accountId,
        categoryId,
        date,
        amountMinor,
        currency,
        note ?? null,
        transferPairId ?? null,
        now,
        id,
      ],
    );

    return {
      id,
      accountId,
      categoryId,
      date,
      amountMinor,
      currency,
      note,
      transferPairId,
      createdAt: existing.createdAt,
      updatedAt: now,
    };
  },

  deleteTransaction: async (id: string): Promise<void> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    const rows = await db.select<SqliteRow[]>(
      "SELECT transfer_pair_id FROM transactions WHERE id = ?",
      [id],
    );
    const transferPairId = rows[0]?.transfer_pair_id ? String(rows[0].transfer_pair_id) : null;

    if (transferPairId) {
      await db.execute(
        "UPDATE transactions SET deleted_at = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ? OR transfer_pair_id = ?",
        [now, now, id, transferPairId],
      );
    } else {
      await db.execute(
        "UPDATE transactions SET deleted_at = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?",
        [now, now, id],
      );
    }
  },

  createTransfer: async (
    fromAccountId: string,
    toAccountId: string,
    amountMinor: number,
    date: string,
    note?: string,
  ): Promise<{ from: Transaction; to: Transaction }> => {
    const db = await getLocalDb();
    await ensureFinanceCategories(db);
    const fromAccount = await localDal.getAccount(fromAccountId);
    if (!fromAccount) throw new Error("Source account not found");
    const toAccount = await localDal.getAccount(toAccountId);
    if (!toAccount) throw new Error("Destination account not found");
    if (fromAccountId === toAccountId) throw new Error("Cannot transfer to the same account");
    if (amountMinor <= 0) throw new Error("Amount must be positive");

    const expenseCats = await db.select<SqliteRow[]>(
      "SELECT id FROM categories WHERE deleted_at IS NULL AND (id = ? OR lower(name) = 'transfer out') AND kind = 'expense' LIMIT 1",
      [SYSTEM_CATEGORY_TRANSFER_OUT_ID],
    );
    let expenseCatId = expenseCats[0]?.id ? String(expenseCats[0].id) : "";
    if (!expenseCatId) {
      const created = await localDal.createCategory({
        name: "Transfer Out",
        kind: "expense",
        isSystem: true,
      });
      expenseCatId = created.id;
    }

    const incomeCats = await db.select<SqliteRow[]>(
      "SELECT id FROM categories WHERE deleted_at IS NULL AND (id = ? OR lower(name) = 'transfer in') AND kind = 'income' LIMIT 1",
      [SYSTEM_CATEGORY_TRANSFER_IN_ID],
    );
    let incomeCatId = incomeCats[0]?.id ? String(incomeCats[0].id) : "";
    if (!incomeCatId) {
      const created = await localDal.createCategory({
        name: "Transfer In",
        kind: "income",
        isSystem: true,
      });
      incomeCatId = created.id;
    }

    const transferPairId = crypto.randomUUID();

    const fromTransaction = await localDal.createTransaction({
      accountId: fromAccountId,
      categoryId: expenseCatId,
      date,
      amountMinor,
      note: note ? `Transfer to ${toAccount.name}: ${note}` : `Transfer to ${toAccount.name}`,
      transferPairId,
    });

    const toTransaction = await localDal.createTransaction({
      accountId: toAccountId,
      categoryId: incomeCatId,
      date,
      amountMinor,
      note: note
        ? `Transfer from ${fromAccount.name}: ${note}`
        : `Transfer from ${fromAccount.name}`,
      transferPairId,
    });

    return { from: fromTransaction, to: toTransaction };
  },

  getMonthlySummary: async (yearMonth: string): Promise<MonthlySummary> => {
    const db = await getLocalDb();
    const valid = /^\d{4}-\d{2}$/.test(yearMonth);
    const targetYm = valid ? yearMonth : new Date().toISOString().slice(0, 7);
    const [yearStr, monthStr] = targetYm.split("-");
    const year = Number.parseInt(yearStr, 10);
    const month = Number.parseInt(monthStr, 10);
    const lastDay = new Date(year, month, 0).getDate();
    const startDate = `${targetYm}-01`;
    const endDate = `${targetYm}-${String(lastDay).padStart(2, "0")}`;

    const incomeRows = await db.select<SqliteRow[]>(
      `SELECT COALESCE(SUM(t.amount_minor), 0) as total
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.date >= ? AND t.date <= ? AND c.kind = 'income' AND t.transfer_pair_id IS NULL AND t.deleted_at IS NULL`,
      [startDate, endDate],
    );

    const expenseRows = await db.select<SqliteRow[]>(
      `SELECT COALESCE(SUM(t.amount_minor), 0) as total
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.date >= ? AND t.date <= ? AND c.kind = 'expense' AND t.transfer_pair_id IS NULL AND t.deleted_at IS NULL`,
      [startDate, endDate],
    );

    const totalIncome = Number(incomeRows[0]?.total ?? 0);
    const totalExpense = Number(expenseRows[0]?.total ?? 0);

    return {
      yearMonth: targetYm,
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
    };
  },

  getCategoryBreakdown: async (yearMonth: string): Promise<CategoryBreakdown[]> => {
    const db = await getLocalDb();
    const valid = /^\d{4}-\d{2}$/.test(yearMonth);
    const targetYm = valid ? yearMonth : new Date().toISOString().slice(0, 7);
    const [yearStr, monthStr] = targetYm.split("-");
    const year = Number.parseInt(yearStr, 10);
    const month = Number.parseInt(monthStr, 10);
    const lastDay = new Date(year, month, 0).getDate();
    const startDate = `${targetYm}-01`;
    const endDate = `${targetYm}-${String(lastDay).padStart(2, "0")}`;

    const rows = await db.select<SqliteRow[]>(
      `SELECT c.id as categoryId, c.name as categoryName, c.kind, SUM(t.amount_minor) as total
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.date >= ? AND t.date <= ? AND t.transfer_pair_id IS NULL AND t.deleted_at IS NULL
       GROUP BY c.id, c.name, c.kind
       ORDER BY total DESC`,
      [startDate, endDate],
    );
    return rows.map((r) => ({
      categoryId: String(r.categoryId),
      categoryName: String(r.categoryName),
      kind: r.kind as CategoryKind,
      total: Number(r.total) || 0,
    }));
  },

  getMonthlyTransactions: async (yearMonth: string): Promise<Transaction[]> => {
    const valid = /^\d{4}-\d{2}$/.test(yearMonth);
    const targetYm = valid ? yearMonth : new Date().toISOString().slice(0, 7);
    const [yearStr, monthStr] = targetYm.split("-");
    const year = Number.parseInt(yearStr, 10);
    const month = Number.parseInt(monthStr, 10);
    const lastDay = new Date(year, month, 0).getDate();
    const startDate = `${targetYm}-01`;
    const endDate = `${targetYm}-${String(lastDay).padStart(2, "0")}`;
    return localDal.getTransactionsByDateRange(startDate, endDate);
  },

  getFinanceWidget: async (): Promise<FinanceDashboardWidget> => {
    const now = new Date().toISOString().split("T")[0].substring(0, 7);
    const summary = await localDal.getMonthlySummary(now);
    const topExpenses = (await localDal.getCategoryBreakdown(now)).filter(
      (e) => e.kind === "expense",
    );

    return {
      summary,
      topExpenses,
    };
  },

  // --- Dashboard Summary ---
  getSummary: async (date?: string): Promise<DashboardSummary> => {
    const db = await getLocalDb();
    const pad = (n: number) => String(n).padStart(2, "0");
    const today = date || getClientDateString();
    const tasks = await localDal.getTasks(today);
    const habits = await localDal.getTodayHabits();
    const reminders = await localDal.getTodayReminders(today);

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

    // --- Workout Week Data ---
    const workoutWeek: DashboardWorkoutDay[] = [];
    const workoutLabelsSet = new Set<string>();
    const daysName = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const nowUtc = new Date(`${today}T00:00:00Z`);
    const dayOfWeekIndex = (nowUtc.getUTCDay() + 6) % 7;
    const monday = new Date(nowUtc);
    monday.setUTCDate(nowUtc.getUTCDate() - dayOfWeekIndex);
    const weekEnd = new Date(monday);
    weekEnd.setUTCDate(monday.getUTCDate() + 6);
    const mondayStr = monday.toISOString().split("T")[0];
    const weekEndStr = weekEnd.toISOString().split("T")[0];

    try {
      const allSessions = await db.select<SqliteRow[]>(
        "SELECT * FROM workout_sessions WHERE deleted_at IS NULL AND started_at >= ? AND started_at <= ?",
        [`${mondayStr}T00:00:00`, `${weekEndStr}T23:59:59`],
      );
      const allWorkouts = await db.select<SqliteRow[]>(
        "SELECT id, name FROM workouts WHERE deleted_at IS NULL",
      );
      const workoutsMap = new Map(allWorkouts.map((w) => [String(w.id), String(w.name)]));

      const dayBuckets: Record<string, Record<string, number>> = {};
      for (const day of daysName) {
        dayBuckets[day] = {};
      }

      for (const session of allSessions) {
        const sessionDate = new Date(String(session.started_at));
        const dayIndex = (sessionDate.getUTCDay() + 6) % 7;
        const dayName = daysName[dayIndex];
        const workoutName = workoutsMap.get(String(session.workout_id)) || "Workout";
        workoutLabelsSet.add(workoutName);

        const durationSeconds = Number(session.duration_seconds) || 0;
        const mins = durationSeconds ? Math.round(durationSeconds / 60) : 30;
        dayBuckets[dayName][workoutName] = (dayBuckets[dayName][workoutName] || 0) + mins;
      }

      for (const day of daysName) {
        const entry: DashboardWorkoutDay = { day };
        for (const [name, mins] of Object.entries(dayBuckets[day])) {
          entry[name] = mins;
        }
        workoutWeek.push(entry);
      }
    } catch {
      // ignore
    }

    // --- Skills Progress Data ---
    const skillsProgress: DashboardSkillProgress[] = [];
    try {
      const areas = await db.select<SqliteRow[]>(
        "SELECT * FROM skill_areas WHERE deleted_at IS NULL ORDER BY created_at ASC LIMIT 4",
      );

      for (const area of areas) {
        const areaId = String(area.id);
        const name = String(area.name);
        const goal = Number(area.weekly_goal_hours) || 5;

        const logs = await db.select<SqliteRow[]>(
          `SELECT l.minutes_spent 
           FROM learning_logs l 
           JOIN learning_resources r ON l.resource_id = r.id 
           WHERE r.skill_area_id = ? AND l.date >= ? AND l.date <= ? AND l.deleted_at IS NULL`,
          [areaId, mondayStr, today],
        );

        const totalMinutes = logs.reduce((sum, l) => sum + (Number(l.minutes_spent) || 0), 0);
        const hoursThisWeek = Math.round((totalMinutes / 60) * 10) / 10;
        const pct = Math.min(100, Math.round((hoursThisWeek / goal) * 100));

        skillsProgress.push({
          skillAreaId: areaId,
          name,
          hoursThisWeek,
          weeklyGoalHours: goal,
          pct,
        });
      }
    } catch {
      // ignore
    }

    // --- Merge with Server Summary if reachable ---
    let serverSummary: DashboardSummary | null = null;
    try {
      const { api } = await import("../api.js");
      serverSummary = await api.getSummary(today);
    } catch {
      // offline / local mode
    }

    const finalNewsItems =
      serverSummary?.newsItems && serverSummary.newsItems.length > 0
        ? serverSummary.newsItems
        : await getDashboardNewsItems();

    const hasLocalWorkouts = workoutWeek.some((d) =>
      Object.keys(d).some((k) => k !== "day" && Number(d[k]) > 0),
    );
    const finalWorkoutWeek = hasLocalWorkouts
      ? workoutWeek
      : serverSummary?.workoutWeek && serverSummary.workoutWeek.length > 0
        ? serverSummary.workoutWeek
        : workoutWeek;

    const finalWorkoutLabels =
      workoutLabelsSet.size > 0 ? Array.from(workoutLabelsSet) : serverSummary?.workoutLabels || [];

    const finalSkillsProgress =
      skillsProgress.length > 0 ? skillsProgress : serverSummary?.skillsProgress || [];

    // Filter and sort today's upcoming reminders
    const nowTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const allReminders = [
      ...reminders,
      ...(serverSummary?.upcomingReminders || []).filter(
        (sr) => !reminders.some((lr) => lr.id === sr.id),
      ),
    ];
    const upcoming = allReminders.filter((r) => !r.completed && r.time >= nowTime);
    const past = allReminders.filter((r) => !r.completed && r.time < nowTime);
    const upcomingReminders = [...upcoming, ...past].slice(0, 4);

    return {
      now: nowTask,
      next: nextTask,
      todayCount: tasks.length,
      todayDoneCount: completedTasks.length,
      dueHabits: habits,
      previous: previousTask,
      upcomingReminders,
      habitConsistency,
      workoutWeek: finalWorkoutWeek,
      workoutLabels: finalWorkoutLabels,
      skillsProgress: finalSkillsProgress,
      newsItems: finalNewsItems,
    };
  },

  // --- Reminders & Notifications ---
  getReminders: async (date?: string): Promise<Reminder[]> => {
    const db = await getLocalDb();
    let sql = "SELECT * FROM reminders WHERE deleted_at IS NULL";
    const args: unknown[] = [];
    if (date) {
      sql += " AND (date = ? OR date IS NULL OR date = '')";
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

  getTodayReminders: async (date?: string): Promise<Reminder[]> => {
    const today = date || getClientDateString();
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

    try {
      const { api } = await import("../api.js");
      api.createReminder(input).catch(() => {});
    } catch {
      // ignore
    }

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
    try {
      const { api } = await import("../api.js");
      api.updateReminder(id, patch).catch(() => {});
    } catch {
      // ignore
    }
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
      `SELECT n.*, t.title as task_title, t.date as task_date, t.start_time as task_start_time
       FROM notifications n
       LEFT JOIN tasks t ON n.task_id = t.id
       WHERE n.deleted_at IS NULL
       ORDER BY n.reminder_time DESC`,
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
      taskTitle: r.task_title ? String(r.task_title) : "",
      taskDate: r.task_date ? String(r.task_date) : "",
      taskStartTime: r.task_start_time ? String(r.task_start_time) : "",
    }));
  },

  getDueNotifications: async (): Promise<NotificationWithTask[]> => {
    const db = await getLocalDb();
    const all = await localDal.getNotifications();
    const now = new Date().toISOString();
    const due = all.filter((n) => n.reminderTime <= now && n.status === "scheduled");

    for (const n of due) {
      await db.execute(
        "UPDATE notifications SET status = 'sent', updated_at = ?, _sync_status = 'pending' WHERE id = ?",
        [now, n.id],
      );
    }
    return due;
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const db = await getLocalDb();
    const rows = await db.select<SqliteRow[]>(
      "SELECT COUNT(*) as count FROM notifications WHERE status = 'scheduled' AND reminder_time <= ? AND deleted_at IS NULL",
      [new Date().toISOString()],
    );
    return { count: Number(rows[0]?.count) || 0 };
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
