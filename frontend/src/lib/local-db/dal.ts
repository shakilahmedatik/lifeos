import {
  type Account,
  type AccountType,
  type AccountWithBalance,
  type Category,
  type CategoryBreakdown,
  type CategoryKind,
  type DashboardHabitConsistency,
  type DashboardSkillProgress,
  type DashboardSummary,
  type DashboardWorkoutDay,
  type DataSource,
  type DayOfWeek,
  DEFAULT_FINANCE_CATEGORIES,
  type EquipmentType,
  type Exercise,
  type ExerciseLog,
  type ExerciseProgressPoint,
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
  type MuscleGroup,
  type NewAccountInput,
  type NewCategoryInput,
  type NewExerciseInput,
  type NewExerciseLogInput,
  type NewHabitDefinitionInput,
  type NewLearningLogInput,
  type NewLearningResourceInput,
  type NewRoutineCategoryInput,
  type NewSkillAreaInput,
  type NewTaskInput,
  type NewTransactionInput,
  type NewWorkoutExerciseInput,
  type NewWorkoutInput,
  RESERVED_CATEGORY_NAMES,
  type ResourceWithProgress,
  type RoutineCategory,
  type RoutineStats,
  type SkillArea,
  type SkillAreaSummary,
  SYSTEM_CATEGORY_OPENING_BALANCE_EXPENSE_ID,
  SYSTEM_CATEGORY_OPENING_BALANCE_ID,
  SYSTEM_CATEGORY_TRANSFER_IN_ID,
  SYSTEM_CATEGORY_TRANSFER_OUT_ID,
  type Task,
  type TaskCategory,
  type TaskHistoryQuery,
  type TaskRecurrence,
  type TaskStatus,
  type Transaction,
  type UpdateLearningLogInput,
  type UpdateLearningResourceInput,
  type UpdateRoutineCategoryInput,
  type UpdateSkillAreaInput,
  type WeeklySummary,
  type Workout,
  type WorkoutExercise,
  type WorkoutSession,
  type WorkoutSessionWithLogs,
  type WorkoutStats,
  type WorkoutWithExercises,
} from "@lifeos/contracts";
import { getLocalDb } from "./index.js";

type SqliteRow = Record<string, unknown>;

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

export const localDal: DataSource = {
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
      recurrence: input.recurrence ?? "none",
      subtasks: input.subtasks ?? [],
      referenceId: input.referenceId,
      createdAt: now,
      updatedAt: now,
    };

    await db.execute(
      `INSERT INTO tasks (id, user_id, title, category, date, start_time, end_time, status, notes, reminder_minutes_before, reminder_silent, reminder_sound, recurrence, subtasks, reference_id, created_at, updated_at, _sync_status)
       VALUES (?, '', ?, ?, ?, ?, ?, ?, ?, null, 0, 'default', ?, ?, ?, ?, ?, 'pending')`,
      [
        task.id,
        task.title,
        task.category,
        task.date,
        task.startTime,
        task.endTime,
        task.status,
        task.notes ?? null,
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
    const rows = await db.select<SqliteRow[]>(
      "SELECT * FROM tasks WHERE id = ? AND deleted_at IS NULL",
      [id],
    );
    if (rows.length === 0) throw new Error("Task not found");
    const r = rows[0];
    return {
      id: String(r.id),
      title: String(r.title),
      category: r.category as TaskCategory,
      date: String(r.date),
      startTime: String(r.start_time),
      endTime: String(r.end_time),
      status: (r.status as TaskStatus) || "planned",
      notes: r.notes ? String(r.notes) : undefined,
      recurrence: (r.recurrence as TaskRecurrence) || "none",
      isOvernight: String(r.start_time) > String(r.end_time),
      subtasks: r.subtasks ? JSON.parse(String(r.subtasks)) : [],
      referenceId: r.reference_id ? String(r.reference_id) : undefined,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    };
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
      `UPDATE tasks SET title = ?, category = ?, date = ?, start_time = ?, end_time = ?, status = ?, notes = ?, recurrence = ?, reference_id = ?, subtasks = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?`,
      [
        updated.title,
        updated.category,
        updated.date,
        updated.startTime,
        updated.endTime,
        updated.status,
        updated.notes ?? null,
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
    if (query?.search) {
      sql += " AND (title LIKE ? OR notes LIKE ?)";
      args.push(`%${query.search}%`, `%${query.search}%`);
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
      subtasks: typeof r.subtasks === "string" ? JSON.parse(r.subtasks) : [],
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));
  },

  getRoutineStats: async (): Promise<RoutineStats> => {
    const db = await getLocalDb();

    // Helper: compute minutes between HH:MM strings
    const durationMinutes = (startTime: string, endTime: string): number => {
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      let mins = eh * 60 + em - (sh * 60 + sm);
      if (mins < 0) mins += 24 * 60; // overnight
      return mins;
    };

    // All tasks
    const allRows = await db.select<SqliteRow[]>(
      "SELECT status, category, start_time, end_time FROM tasks WHERE deleted_at IS NULL",
    );

    let totalTasks = 0;
    let completedTasks = 0;
    let plannedTasks = 0;
    let inProgressTasks = 0;
    let skippedTasks = 0;
    let totalScheduledMinutes = 0;
    let completedMinutes = 0;

    const categoryMap: Record<
      string,
      { taskCount: number; totalMinutes: number; completedMinutes: number }
    > = {};

    for (const r of allRows) {
      totalTasks++;
      const status = String(r.status || "planned");
      const cat = String(r.category || "general");
      const mins = durationMinutes(String(r.start_time || "00:00"), String(r.end_time || "00:00"));
      totalScheduledMinutes += mins;

      if (status === "done") {
        completedTasks++;
        completedMinutes += mins;
      } else if (status === "in_progress") {
        inProgressTasks++;
      } else if (status === "skipped") {
        skippedTasks++;
      } else {
        plannedTasks++;
      }

      if (!categoryMap[cat]) {
        categoryMap[cat] = { taskCount: 0, totalMinutes: 0, completedMinutes: 0 };
      }
      categoryMap[cat].taskCount++;
      categoryMap[cat].totalMinutes += mins;
      if (status === "done") {
        categoryMap[cat].completedMinutes += mins;
      }
    }

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const categoryDistribution = Object.entries(categoryMap).map(([category, data]) => ({
      category: category as TaskCategory,
      taskCount: data.taskCount,
      totalMinutes: data.totalMinutes,
      completedMinutes: data.completedMinutes,
    }));

    // Today stats
    const todayStr = getClientDateString();
    const todayRows = await db.select<SqliteRow[]>(
      "SELECT status FROM tasks WHERE date = ? AND deleted_at IS NULL",
      [todayStr],
    );
    const totalTodayCount = todayRows.length;
    const completedTodayCount = todayRows.filter((r) => String(r.status) === "done").length;
    const todayCompletionRate =
      totalTodayCount > 0 ? Math.round((completedTodayCount / totalTodayCount) * 100) : 0;

    // Weekly trends (last 7 days)
    const weeklyTrends: { date: string; total: number; completed: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayRows = await db.select<{ total: number; completed: number }[]>(
        `SELECT
           COUNT(*) as total,
           SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed
         FROM tasks WHERE date = ? AND deleted_at IS NULL`,
        [dateStr],
      );
      weeklyTrends.push({
        date: dateStr,
        total: dayRows[0]?.total || 0,
        completed: dayRows[0]?.completed || 0,
      });
    }

    return {
      totalTasks,
      completedTasks,
      plannedTasks,
      inProgressTasks,
      skippedTasks,
      completionRate,
      totalScheduledMinutes,
      completedMinutes,
      completedTodayCount,
      totalTodayCount,
      todayCompletionRate,
      categoryDistribution,
      weeklyTrends,
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

    // Get the actual count of reassigned rows
    const changesResult = await db.select<{ cnt: number }[]>("SELECT changes() as cnt");
    const reassignedCount = changesResult[0]?.cnt || 0;

    await db.execute(
      "UPDATE routine_categories SET deleted_at = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [new Date().toISOString(), new Date().toISOString(), id],
    );

    return { success: true, reassignedCount };
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

  getHabit: async (id: string): Promise<HabitDefinition> => {
    const habits = await localDal.getHabits();
    const habit = habits.find((h) => h.id === id);
    if (!habit) throw new Error("Habit not found");
    return habit;
  },

  deleteHabit: async (id: string): Promise<void> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE habits SET deleted_at = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [now, now, id],
    );
  },

  archiveHabit: async (id: string, archived: boolean): Promise<void> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE habits SET archived = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [archived ? 1 : 0, now, id],
    );
  },

  reorderHabits: async (orders: { id: string; sortOrder: number }[]): Promise<void> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    for (const order of orders) {
      await db.execute(
        "UPDATE habits SET sort_order = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?",
        [order.sortOrder, now, order.id],
      );
    }
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

  getHabitStats: async (id: string, startDate: string, endDate: string): Promise<HabitStats> => {
    const db = await getLocalDb();
    const logs = await db.select<SqliteRow[]>(
      "SELECT date FROM habit_logs WHERE habit_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL ORDER BY date ASC",
      [id, startDate, endDate],
    );

    const totalCompletions = logs.length;

    // Compute total days in range for completion rate
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    );

    // Unique logged dates
    const loggedDates = new Set(logs.map((l) => String(l.date).split("T")[0]));
    const completionRate = Math.round((loggedDates.size / totalDays) * 100);

    // Streak calculation: iterate backwards from endDate
    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;
    const cursor = new Date(endDate);
    while (cursor >= start) {
      const dateStr = cursor.toISOString().split("T")[0];
      if (loggedDates.has(dateStr)) {
        streak++;
        if (streak > longestStreak) longestStreak = streak;
      } else {
        // If we haven't broken the current streak yet, record it
        if (currentStreak === 0 && streak > 0) currentStreak = streak;
        streak = 0;
      }
      cursor.setDate(cursor.getDate() - 1);
    }
    // If streak reaches the start without breaking, it's the current streak
    if (currentStreak === 0) currentStreak = streak;
    if (streak > longestStreak) longestStreak = streak;

    return {
      habitId: id,
      totalCompletions,
      currentStreak,
      longestStreak,
      completionRate,
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
    const existing = (await localDal.getSkillAreas()).find((a) => a.id === id);
    if (!existing) throw new Error("Skill area not found");

    const name = patch.name ?? existing.name;
    const weeklyGoalHours = patch.weeklyGoalHours ?? existing.weeklyGoalHours;

    await db.execute(
      "UPDATE skill_areas SET name = ?, weekly_goal_hours = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [name, weeklyGoalHours, now, id],
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

    const db = await getLocalDb();

    // Count resources in this area
    const resourceRes = await db.select<{ count: number }[]>(
      "SELECT COUNT(*) as count FROM learning_resources WHERE skill_area_id = ? AND deleted_at IS NULL",
      [areaId],
    );
    const totalResources = resourceRes[0]?.count || 0;

    // Aggregate sessions and minutes from learning_logs via learning_resources
    const logRes = await db.select<{ sessions: number; minutes: number }[]>(
      `SELECT COUNT(*) as sessions, COALESCE(SUM(ll.minutes_spent), 0) as minutes
       FROM learning_logs ll
       JOIN learning_resources lr ON ll.resource_id = lr.id
       WHERE lr.skill_area_id = ? AND ll.deleted_at IS NULL AND lr.deleted_at IS NULL`,
      [areaId],
    );
    const totalSessions = logRes[0]?.sessions || 0;
    const totalMinutesSpent = logRes[0]?.minutes || 0;

    return {
      skillArea: area,
      totalResources,
      totalMinutesSpent,
      totalSessions,
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
    const existing = (await localDal.getLearningResources()).find((r) => r.id === id);
    if (!existing) throw new Error("Resource not found");

    const title = patch.title ?? existing.title;
    const type = patch.type ?? existing.type;
    const skillAreaId = patch.skillAreaId ?? existing.skillAreaId;
    const totalUnits = patch.totalUnits !== undefined ? patch.totalUnits : existing.totalUnits;
    const unit = patch.unit !== undefined ? patch.unit : existing.unit;

    await db.execute(
      "UPDATE learning_resources SET title = ?, type = ?, skill_area_id = ?, total_units = ?, unit = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [title, type, skillAreaId, totalUnits ?? null, unit ?? null, now, id],
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

    // Look up the skill area name
    const areaRows = await db.select<SqliteRow[]>(
      "SELECT name FROM skill_areas WHERE id = ? AND deleted_at IS NULL",
      [resource.skillAreaId],
    );
    const skillAreaName = areaRows.length > 0 ? String(areaRows[0].name) : "";

    return {
      ...resource,
      totalMinutesSpent,
      totalUnitsCompleted,
      completionPercent: resource.totalUnits
        ? Math.round((totalUnitsCompleted / resource.totalUnits) * 100)
        : 0,
      skillAreaName,
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
    const rows = await db.select<SqliteRow[]>(
      "SELECT * FROM learning_logs WHERE id = ? AND deleted_at IS NULL",
      [id],
    );
    if (rows.length === 0) throw new Error("Log not found");
    const existing = rows[0];

    const date = patch.date ?? String(existing.date);
    const minutesSpent = patch.minutesSpent ?? Number(existing.minutes_spent);
    const unitsCompleted =
      patch.unitsCompleted !== undefined
        ? patch.unitsCompleted
        : typeof existing.units_completed === "number"
          ? existing.units_completed
          : null;
    const notes =
      patch.notes !== undefined ? patch.notes : existing.notes ? String(existing.notes) : null;

    await db.execute(
      "UPDATE learning_logs SET date = ?, minutes_spent = ?, units_completed = ?, notes = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [date, minutesSpent, unitsCompleted, notes, now, id],
    );
    const updatedRows = await db.select<SqliteRow[]>(
      "SELECT * FROM learning_logs WHERE id = ? AND deleted_at IS NULL",
      [id],
    );
    if (updatedRows.length === 0) throw new Error("Log not found");
    const r = updatedRows[0];
    return {
      id: String(r.id),
      resourceId: String(r.resource_id),
      date: String(r.date),
      minutesSpent: Number(r.minutes_spent),
      unitsCompleted: typeof r.units_completed === "number" ? r.units_completed : undefined,
      notes: r.notes ? String(r.notes) : undefined,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    };
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
    await ensureFinanceCategories(db);
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

    if (input.initialBalanceMinor && input.initialBalanceMinor !== 0) {
      const isPositive = input.initialBalanceMinor > 0;
      const categoryId = isPositive
        ? SYSTEM_CATEGORY_OPENING_BALANCE_ID
        : SYSTEM_CATEGORY_OPENING_BALANCE_EXPENSE_ID;

      await localDal.createTransaction({
        accountId: account.id,
        categoryId,
        date: getClientDateString(),
        amountMinor: Math.abs(input.initialBalanceMinor),
        note: "Opening balance",
      });
    }

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
      `UPDATE transactions SET deleted_at = ?, updated_at = ?, _sync_status = 'pending'
       WHERE account_id = ? AND category_id IN (?, ?)`,
      [
        now,
        now,
        id,
        SYSTEM_CATEGORY_OPENING_BALANCE_ID,
        SYSTEM_CATEGORY_OPENING_BALANCE_EXPENSE_ID,
      ],
    );
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
      RESERVED_CATEGORY_NAMES.some((n) => n.toLowerCase() === patch.name?.trim().toLowerCase())
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
       WHERE t.date >= ? AND t.date <= ? AND c.kind = 'income' AND t.transfer_pair_id IS NULL AND t.deleted_at IS NULL
         AND c.id NOT IN (?, ?)`,
      [
        startDate,
        endDate,
        SYSTEM_CATEGORY_OPENING_BALANCE_ID,
        SYSTEM_CATEGORY_OPENING_BALANCE_EXPENSE_ID,
      ],
    );

    const expenseRows = await db.select<SqliteRow[]>(
      `SELECT COALESCE(SUM(t.amount_minor), 0) as total
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.date >= ? AND t.date <= ? AND c.kind = 'expense' AND t.transfer_pair_id IS NULL AND t.deleted_at IS NULL
         AND c.id NOT IN (?, ?)`,
      [
        startDate,
        endDate,
        SYSTEM_CATEGORY_OPENING_BALANCE_ID,
        SYSTEM_CATEGORY_OPENING_BALANCE_EXPENSE_ID,
      ],
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
         AND c.id NOT IN (?, ?)
       GROUP BY c.id, c.name, c.kind
       ORDER BY total DESC`,
      [
        startDate,
        endDate,
        SYSTEM_CATEGORY_OPENING_BALANCE_ID,
        SYSTEM_CATEGORY_OPENING_BALANCE_EXPENSE_ID,
      ],
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

    const finalWorkoutWeek = workoutWeek;
    const finalWorkoutLabels = workoutLabelsSet.size > 0 ? Array.from(workoutLabelsSet) : [];
    const finalSkillsProgress = skillsProgress;

    return {
      now: nowTask,
      next: nextTask,
      todayCount: tasks.length,
      todayDoneCount: completedTasks.length,
      dueHabits: habits,
      previous: previousTask,
      habitConsistency,
      workoutWeek: finalWorkoutWeek,
      workoutLabels: finalWorkoutLabels,
      skillsProgress: finalSkillsProgress,
    };
  },

  // --- Workouts ---
  getWorkouts: async (): Promise<Workout[]> => {
    const db = await getLocalDb();
    const rows = await db.select<SqliteRow[]>(`
      SELECT w.*, COUNT(we.id) as exercise_count
      FROM workouts w
      LEFT JOIN workout_exercises we ON w.id = we.workout_id AND we.deleted_at IS NULL
      WHERE w.deleted_at IS NULL
      GROUP BY w.id
      ORDER BY w.created_at DESC
    `);
    return rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      description: r.description ? String(r.description) : undefined,
      scheduledDay: r.scheduled_day ? (r.scheduled_day as DayOfWeek) : undefined,
      scheduledTime: r.scheduled_time ? String(r.scheduled_time) : undefined,
      exerciseCount: Number(r.exercise_count) || 0,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));
  },

  getWorkout: async (id: string): Promise<WorkoutWithExercises> => {
    const db = await getLocalDb();
    const wRows = await db.select<SqliteRow[]>(
      "SELECT * FROM workouts WHERE id = ? AND deleted_at IS NULL",
      [id],
    );
    if (wRows.length === 0) throw new Error("Workout not found");
    const w = wRows[0];

    const exRows = await db.select<SqliteRow[]>(
      "SELECT * FROM workout_exercises WHERE workout_id = ? AND deleted_at IS NULL ORDER BY order_index ASC",
      [id],
    );
    const exercises: WorkoutExercise[] = exRows.map((r) => ({
      id: String(r.id),
      workoutId: String(r.workout_id),
      exerciseId: String(r.exercise_id),
      sets: Number(r.sets),
      reps: Number(r.reps),
      repsArray: r.reps_per_set ? JSON.parse(String(r.reps_per_set)) : undefined,
      weight: typeof r.weight === "number" ? r.weight : undefined,
      weights: r.weight_per_set ? JSON.parse(String(r.weight_per_set)) : undefined,
      restSeconds: Number(r.rest_seconds) || 60,
      orderIndex: Number(r.order_index) || 0,
      createdAt: String(r.created_at),
    }));

    return {
      id: String(w.id),
      name: String(w.name),
      description: w.description ? String(w.description) : undefined,
      scheduledDay: w.scheduled_day ? (w.scheduled_day as DayOfWeek) : undefined,
      scheduledTime: w.scheduled_time ? String(w.scheduled_time) : undefined,
      exerciseCount: exercises.length,
      exercises,
      createdAt: String(w.created_at),
      updatedAt: String(w.updated_at),
    };
  },

  createWorkout: async (input: NewWorkoutInput): Promise<Workout> => {
    const db = await getLocalDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const workout: Workout = {
      id,
      name: input.name,
      description: input.description,
      scheduledDay: input.scheduledDay,
      scheduledTime: input.scheduledTime,
      exerciseCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await db.execute(
      `INSERT INTO workouts (id, user_id, name, description, scheduled_day, scheduled_time, created_at, updated_at, _sync_status)
       VALUES (?, '', ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        workout.id,
        workout.name,
        workout.description ?? null,
        workout.scheduledDay ?? null,
        workout.scheduledTime ?? null,
        now,
        now,
      ],
    );

    return workout;
  },

  updateWorkout: async (id: string, patch: Partial<NewWorkoutInput>): Promise<Workout> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    const existing = await localDal.getWorkout(id);
    if (!existing) throw new Error("Workout not found");

    const name = patch.name ?? existing.name;
    const description = patch.description !== undefined ? patch.description : existing.description;
    const scheduledDay =
      patch.scheduledDay !== undefined ? patch.scheduledDay : existing.scheduledDay;
    const scheduledTime =
      patch.scheduledTime !== undefined ? patch.scheduledTime : existing.scheduledTime;

    await db.execute(
      `UPDATE workouts SET name = ?, description = ?, scheduled_day = ?, scheduled_time = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?`,
      [name, description ?? null, scheduledDay ?? null, scheduledTime ?? null, now, id],
    );

    return {
      id,
      name,
      description,
      scheduledDay,
      scheduledTime,
      exerciseCount: existing.exerciseCount,
      createdAt: existing.createdAt,
      updatedAt: now,
    };
  },

  deleteWorkout: async (id: string): Promise<void> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE workouts SET deleted_at = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [now, now, id],
    );
  },

  addExerciseToWorkout: async (
    workoutId: string,
    exerciseId: string,
    input: NewWorkoutExerciseInput,
  ): Promise<WorkoutExercise> => {
    const db = await getLocalDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const we: WorkoutExercise = {
      id,
      workoutId,
      exerciseId,
      sets: input.sets ?? 3,
      reps: input.reps ?? 10,
      repsArray: input.repsArray,
      weight: input.weight,
      weights: input.weights,
      restSeconds: input.restSeconds ?? 60,
      orderIndex: input.orderIndex ?? 0,
      createdAt: now,
    };

    await db.execute(
      `INSERT INTO workout_exercises (id, workout_id, exercise_id, sets, reps, reps_per_set, weight, weight_per_set, rest_seconds, order_index, created_at, _sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        we.id,
        we.workoutId,
        we.exerciseId,
        we.sets,
        we.reps,
        we.repsArray ? JSON.stringify(we.repsArray) : null,
        we.weight ?? null,
        we.weights ? JSON.stringify(we.weights) : null,
        we.restSeconds,
        we.orderIndex,
        now,
      ],
    );

    return we;
  },

  updateWorkoutExercise: async (
    workoutId: string,
    exerciseId: string,
    patch: Partial<NewWorkoutExerciseInput>,
  ): Promise<WorkoutExercise> => {
    const db = await getLocalDb();
    const rows = await db.select<SqliteRow[]>(
      "SELECT * FROM workout_exercises WHERE workout_id = ? AND exercise_id = ? AND deleted_at IS NULL",
      [workoutId, exerciseId],
    );
    if (rows.length === 0) throw new Error("Workout exercise not found");
    const existing = rows[0];

    const sets = patch.sets ?? Number(existing.sets);
    const reps = patch.reps ?? Number(existing.reps);
    const repsArray =
      patch.repsArray !== undefined
        ? patch.repsArray
        : existing.reps_per_set
          ? JSON.parse(String(existing.reps_per_set))
          : undefined;
    const weight =
      patch.weight !== undefined
        ? patch.weight
        : typeof existing.weight === "number"
          ? existing.weight
          : undefined;
    const weights =
      patch.weights !== undefined
        ? patch.weights
        : existing.weight_per_set
          ? JSON.parse(String(existing.weight_per_set))
          : undefined;
    const restSeconds = patch.restSeconds ?? Number(existing.rest_seconds);
    const orderIndex = patch.orderIndex ?? Number(existing.order_index);

    await db.execute(
      `UPDATE workout_exercises SET sets = ?, reps = ?, reps_per_set = ?, weight = ?, weight_per_set = ?, rest_seconds = ?, order_index = ?, _sync_status = 'pending' WHERE id = ?`,
      [
        sets,
        reps,
        repsArray ? JSON.stringify(repsArray) : null,
        weight ?? null,
        weights ? JSON.stringify(weights) : null,
        restSeconds,
        orderIndex,
        existing.id,
      ],
    );

    return {
      id: String(existing.id),
      workoutId,
      exerciseId,
      sets,
      reps,
      repsArray,
      weight,
      weights,
      restSeconds,
      orderIndex,
      createdAt: String(existing.created_at),
    };
  },

  removeExerciseFromWorkout: async (workoutId: string, exerciseId: string): Promise<void> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE workout_exercises SET deleted_at = ?, _sync_status = 'pending' WHERE workout_id = ? AND exercise_id = ?",
      [now, workoutId, exerciseId],
    );
  },

  reorderWorkoutExercises: async (workoutId: string, exerciseIds: string[]): Promise<void> => {
    const db = await getLocalDb();
    for (let i = 0; i < exerciseIds.length; i++) {
      await db.execute(
        "UPDATE workout_exercises SET order_index = ?, _sync_status = 'pending' WHERE id = ? AND workout_id = ?",
        [i, exerciseIds[i], workoutId],
      );
    }
  },

  getExercises: async (): Promise<Exercise[]> => {
    const db = await getLocalDb();
    const rows = await db.select<SqliteRow[]>(
      "SELECT * FROM exercises WHERE deleted_at IS NULL ORDER BY name ASC",
    );
    return rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      muscleGroup: (r.category || r.muscle_group || "general") as MuscleGroup,
      equipment: (r.equipment as EquipmentType) || "other",
      videoUrl: r.video_url ? String(r.video_url) : undefined,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at || r.created_at),
    }));
  },

  getExercise: async (id: string): Promise<Exercise> => {
    const db = await getLocalDb();
    const rows = await db.select<SqliteRow[]>(
      "SELECT * FROM exercises WHERE id = ? AND deleted_at IS NULL",
      [id],
    );
    if (rows.length === 0) throw new Error("Exercise not found");
    const r = rows[0];
    return {
      id: String(r.id),
      name: String(r.name),
      muscleGroup: (r.category || r.muscle_group || "general") as MuscleGroup,
      equipment: (r.equipment as EquipmentType) || "other",
      videoUrl: r.video_url ? String(r.video_url) : undefined,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at || r.created_at),
    };
  },

  createExercise: async (input: NewExerciseInput): Promise<Exercise> => {
    const db = await getLocalDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const ex: Exercise = {
      id,
      name: input.name,
      muscleGroup: input.muscleGroup || "general",
      equipment: input.equipment || "other",
      videoUrl: input.videoUrl,
      createdAt: now,
      updatedAt: now,
    };

    await db.execute(
      `INSERT INTO exercises (id, name, category, equipment, video_url, created_at, updated_at, _sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [ex.id, ex.name, ex.muscleGroup, ex.equipment, ex.videoUrl ?? null, now, now],
    );

    return ex;
  },

  updateExercise: async (id: string, patch: Partial<NewExerciseInput>): Promise<Exercise> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    const existing = await localDal.getExercise(id);
    if (!existing) throw new Error("Exercise not found");

    const name = patch.name ?? existing.name;
    const muscleGroup = patch.muscleGroup ?? existing.muscleGroup;
    const equipment = patch.equipment ?? existing.equipment;
    const videoUrl = patch.videoUrl !== undefined ? patch.videoUrl : existing.videoUrl;

    await db.execute(
      `UPDATE exercises SET name = ?, category = ?, equipment = ?, video_url = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?`,
      [name, muscleGroup, equipment, videoUrl ?? null, now, id],
    );

    return {
      id,
      name,
      muscleGroup,
      equipment,
      videoUrl,
      createdAt: existing.createdAt,
      updatedAt: now,
    };
  },

  deleteExercise: async (id: string): Promise<void> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE exercises SET deleted_at = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [now, now, id],
    );
  },

  getWorkoutSessions: async (): Promise<WorkoutSession[]> => {
    const db = await getLocalDb();
    const rows = await db.select<SqliteRow[]>(
      "SELECT * FROM workout_sessions WHERE deleted_at IS NULL ORDER BY started_at DESC",
    );
    return rows.map((r) => ({
      id: String(r.id),
      workoutId: String(r.workout_id),
      startedAt: String(r.started_at),
      completedAt: r.completed_at ? String(r.completed_at) : undefined,
      durationSeconds: typeof r.duration_seconds === "number" ? r.duration_seconds : undefined,
      notes: r.notes ? String(r.notes) : undefined,
    }));
  },

  getWorkoutSession: async (id: string): Promise<WorkoutSessionWithLogs> => {
    const db = await getLocalDb();
    const sRows = await db.select<SqliteRow[]>(
      "SELECT * FROM workout_sessions WHERE id = ? AND deleted_at IS NULL",
      [id],
    );
    if (sRows.length === 0) throw new Error("Workout session not found");
    const s = sRows[0];

    const logRows = await db.select<SqliteRow[]>(
      "SELECT * FROM exercise_logs WHERE session_id = ? AND deleted_at IS NULL ORDER BY exercise_id, set_number ASC",
      [id],
    );
    const logs: ExerciseLog[] = logRows.map((r) => ({
      id: String(r.id),
      sessionId: String(r.session_id),
      exerciseId: String(r.exercise_id),
      setNumber: Number(r.set_number),
      actualReps: Number(r.actual_reps),
      actualWeight: typeof r.actual_weight === "number" ? r.actual_weight : undefined,
      completedAt: String(r.completed_at),
    }));

    return {
      id: String(s.id),
      workoutId: String(s.workout_id),
      startedAt: String(s.started_at),
      completedAt: s.completed_at ? String(s.completed_at) : undefined,
      durationSeconds: typeof s.duration_seconds === "number" ? s.duration_seconds : undefined,
      notes: s.notes ? String(s.notes) : undefined,
      logs,
    };
  },

  startWorkoutSession: async (workoutId: string): Promise<WorkoutSession> => {
    const db = await getLocalDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const session: WorkoutSession = {
      id,
      workoutId,
      startedAt: now,
    };

    await db.execute(
      `INSERT INTO workout_sessions (id, user_id, workout_id, started_at, _sync_status)
       VALUES (?, '', ?, ?, 'pending')`,
      [session.id, session.workoutId, now],
    );

    return session;
  },

  completeWorkoutSession: async (
    id: string,
    durationSeconds: number,
    notes?: string,
  ): Promise<WorkoutSession> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE workout_sessions SET completed_at = ?, duration_seconds = ?, notes = ?, _sync_status = 'pending' WHERE id = ?",
      [now, durationSeconds, notes ?? null, id],
    );
    const updated = await localDal.getWorkoutSession(id);
    return {
      id: updated.id,
      workoutId: updated.workoutId,
      startedAt: updated.startedAt,
      completedAt: updated.completedAt,
      durationSeconds: updated.durationSeconds,
      notes: updated.notes,
    };
  },

  deleteWorkoutSession: async (id: string): Promise<void> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE workout_sessions SET deleted_at = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [now, now, id],
    );
  },

  cancelWorkoutSession: async (sessionId: string): Promise<void> => {
    const db = await getLocalDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE workout_sessions SET deleted_at = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?",
      [now, now, sessionId],
    );
  },

  addExerciseLog: async (sessionId: string, input: NewExerciseLogInput): Promise<ExerciseLog> => {
    const db = await getLocalDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const log: ExerciseLog = {
      id,
      sessionId,
      exerciseId: input.exerciseId,
      setNumber: input.setNumber,
      actualReps: input.actualReps,
      actualWeight: input.actualWeight,
      completedAt: now,
    };

    await db.execute(
      `INSERT INTO exercise_logs (id, session_id, exercise_id, set_number, actual_reps, actual_weight, completed_at, _sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        log.id,
        log.sessionId,
        log.exerciseId,
        log.setNumber,
        log.actualReps,
        log.actualWeight ?? null,
        now,
      ],
    );

    return log;
  },

  getExerciseLogs: async (sessionId: string): Promise<ExerciseLog[]> => {
    const db = await getLocalDb();
    const rows = await db.select<SqliteRow[]>(
      "SELECT * FROM exercise_logs WHERE session_id = ? AND deleted_at IS NULL ORDER BY exercise_id, set_number ASC",
      [sessionId],
    );
    return rows.map((r) => ({
      id: String(r.id),
      sessionId: String(r.session_id),
      exerciseId: String(r.exercise_id),
      setNumber: Number(r.set_number),
      actualReps: Number(r.actual_reps),
      actualWeight: typeof r.actual_weight === "number" ? r.actual_weight : undefined,
      completedAt: String(r.completed_at),
    }));
  },

  getWorkoutHistory: async (): Promise<WorkoutSession[]> => {
    return localDal.getWorkoutSessions();
  },

  getWorkoutStats: async (): Promise<WorkoutStats> => {
    const db = await getLocalDb();
    const workouts = await localDal.getWorkouts();
    const sessions = await db.select<SqliteRow[]>(
      "SELECT * FROM workout_sessions WHERE completed_at IS NOT NULL AND deleted_at IS NULL ORDER BY started_at DESC",
    );
    const totalSessions = sessions.length;
    const totalDuration = sessions.reduce((acc, s) => acc + (Number(s.duration_seconds) || 0), 0);
    const averageDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;
    const lastWorkoutDate = sessions.length > 0 ? String(sessions[0].started_at) : undefined;

    return {
      totalWorkouts: workouts.length,
      totalSessions,
      totalDuration,
      averageDuration,
      lastWorkoutDate,
    };
  },

  getRecentWorkoutSessions: async (limit = 10): Promise<WorkoutSession[]> => {
    const db = await getLocalDb();
    const rows = await db.select<SqliteRow[]>(
      "SELECT * FROM workout_sessions WHERE deleted_at IS NULL ORDER BY started_at DESC LIMIT ?",
      [limit],
    );
    return rows.map((r) => ({
      id: String(r.id),
      workoutId: String(r.workout_id),
      startedAt: String(r.started_at),
      completedAt: r.completed_at ? String(r.completed_at) : undefined,
      durationSeconds: typeof r.duration_seconds === "number" ? r.duration_seconds : undefined,
      notes: r.notes ? String(r.notes) : undefined,
    }));
  },

  getExerciseProgress: async (exerciseId: string): Promise<ExerciseProgressPoint[]> => {
    const db = await getLocalDb();
    const rows = await db.select<SqliteRow[]>(
      `
      SELECT
        el.session_id,
        ws.started_at as date,
        MAX(el.actual_weight) as max_weight,
        AVG(el.actual_reps) as avg_reps,
        COUNT(*) as total_sets
      FROM exercise_logs el
      JOIN workout_sessions ws ON ws.id = el.session_id
      WHERE el.exercise_id = ? AND ws.completed_at IS NOT NULL AND el.deleted_at IS NULL AND ws.deleted_at IS NULL
      GROUP BY el.session_id
      ORDER BY ws.started_at ASC
    `,
      [exerciseId],
    );

    return rows.map((row) => ({
      sessionId: String(row.session_id),
      date: String(row.date),
      maxWeight: Number(row.max_weight) || 0,
      avgReps: Math.round((Number(row.avg_reps) || 0) * 10) / 10,
      totalSets: Number(row.total_sets) || 0,
    }));
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
