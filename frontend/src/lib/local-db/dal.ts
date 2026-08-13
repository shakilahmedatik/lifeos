import type {
  Account,
  AccountWithBalance,
  Category,
  CategoryBreakdown,
  DashboardSummary,
  FinanceDashboardWidget,
  HabitDefinition,
  HabitLogEntry,
  HabitStats,
  HabitWithStreak,
  LearningLog,
  LearningResource,
  MonthlySummary,
  NewAccountInput,
  NewCategoryInput,
  NewHabitDefinitionInput,
  NewLearningLogInput,
  NewLearningResourceInput,
  NewNotificationInput,
  NewReminderInput,
  NewSkillAreaInput,
  NewTaskInput,
  NewTransactionInput,
  Notification,
  NotificationSoundType,
  NotificationWithTask,
  Reminder,
  ResourceWithProgress,
  RoutineStats,
  SkillArea,
  SkillAreaSummary,
  Task,
  TaskCategory,
  TaskHistoryQuery,
  TaskStatus,
  Transaction,
  UpdateLearningLogInput,
  UpdateLearningResourceInput,
  UpdateReminderInput,
  UpdateSkillAreaInput,
  WeeklySummary,
} from "@lifeos/contracts";
import { getLocalDb } from "./index.js";

type SqliteRow = Record<string, unknown>;

function getCurrentUserId(): string {
  try {
    const raw = localStorage.getItem("lifeos_session_user");
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.id || "";
    }
  } catch {
    // fallback
  }
  return "";
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
      userId: String(r.user_id),
      title: String(r.title),
      category: r.category as TaskCategory,
      date: String(r.date),
      startTime: String(r.start_time),
      endTime: String(r.end_time),
      status: r.status as TaskStatus,
      notes: r.notes ? String(r.notes) : undefined,
      subtasks: typeof r.subtasks === "string" ? JSON.parse(r.subtasks) : [],
      reminderMinutesBefore:
        typeof r.reminder_minutes_before === "number" ? r.reminder_minutes_before : undefined,
      reminderSound: typeof r.reminder_sound === "number" ? r.reminder_sound : 1,
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
    const userId = getCurrentUserId();

    const task: Task = {
      id,
      userId,
      title: input.title,
      category: input.category,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      status: "planned",
      notes: input.notes,
      reminderMinutesBefore: input.reminderMinutesBefore,
      reminderSound: input.reminderSound ?? 1,
      recurrence: input.recurrence ?? "none",
      subtasks: input.subtasks ?? [],
      referenceId: input.referenceId,
      createdAt: now,
      updatedAt: now,
    };

    await db.execute(
      `INSERT INTO tasks (id, user_id, title, category, date, start_time, end_time, status, notes, reminder_minutes_before, reminder_sound, recurrence, subtasks, reference_id, created_at, updated_at, _sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        task.id,
        task.userId,
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
      status: patch.status ?? (existing.status as TaskStatus),
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
      userId: String(existing.user_id),
      title: updated.title,
      category: updated.category,
      date: updated.date,
      startTime: updated.startTime,
      endTime: updated.endTime,
      status: updated.status,
      notes: updated.notes,
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
      userId: String(r.user_id),
      title: String(r.title),
      category: r.category as TaskCategory,
      date: String(r.date),
      startTime: String(r.start_time),
      endTime: String(r.end_time),
      status: r.status as TaskStatus,
      notes: r.notes ? String(r.notes) : undefined,
      subtasks: typeof r.subtasks === "string" ? JSON.parse(r.subtasks) : [],
      reminderMinutesBefore:
        typeof r.reminder_minutes_before === "number" ? r.reminder_minutes_before : undefined,
      reminderSound: typeof r.reminder_sound === "number" ? r.reminder_sound : 1,
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

    return { totalTasks, completedTasks, completionRate };
  },

  // --- Habits ---
  getHabits: async (): Promise<HabitDefinition[]> => {
    const db = await getLocalDb();
    const rows = await db.select<SqliteRow[]>(
      "SELECT * FROM habits WHERE deleted_at IS NULL ORDER BY sort_order ASC",
    );
    return rows.map((r) => ({
      id: String(r.id),
      userId: String(r.user_id),
      name: String(r.name),
      frequency: String(r.frequency),
      targetDaysPerWeek: Number(r.target_days_per_week),
      type: r.type as HabitDefinition["type"],
      category: String(r.category),
      config: typeof r.config === "string" ? JSON.parse(r.config) : r.config,
      icon: r.icon ? String(r.icon) : undefined,
      color: r.color ? String(r.color) : undefined,
      archived: Number(r.archived),
      sortOrder: Number(r.sort_order),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));
  },

  createHabit: async (input: NewHabitDefinitionInput): Promise<HabitDefinition> => {
    const db = await getLocalDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const userId = getCurrentUserId();

    const habit: HabitDefinition = {
      id,
      userId,
      name: input.name,
      frequency: input.frequency ?? "daily",
      targetDaysPerWeek: input.targetDaysPerWeek ?? 7,
      type: input.type ?? "boolean",
      category: input.category ?? "general",
      config: input.config ?? { type: input.type ?? "boolean" },
      icon: input.icon,
      color: input.color,
      archived: 0,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    };

    await db.execute(
      `INSERT INTO habits (id, user_id, name, frequency, target_days_per_week, type, category, config, icon, color, archived, sort_order, created_at, updated_at, _sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, 'pending')`,
      [
        habit.id,
        habit.userId,
        habit.name,
        habit.frequency,
        habit.targetDaysPerWeek,
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
      config: patch.config ? JSON.stringify(patch.config) : String(existing.config),
      archived: patch.archived !== undefined ? patch.archived : Number(existing.archived),
      sort_order: patch.sortOrder !== undefined ? patch.sortOrder : Number(existing.sort_order),
      updated_at: now,
    };

    await db.execute(
      `UPDATE habits SET name = ?, config = ?, archived = ?, sort_order = ?, updated_at = ?, _sync_status = 'pending' WHERE id = ?`,
      [updated.name, updated.config, updated.archived, updated.sort_order, now, id],
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
    const userId = getCurrentUserId();

    const entry: HabitLogEntry = {
      id,
      userId,
      habitId,
      date: logDate,
      value,
      meta,
      loggedAt: now,
    };

    await db.execute(
      `INSERT INTO habit_logs (id, user_id, habit_id, date, value, meta, logged_at, _sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        entry.id,
        entry.userId,
        entry.habitId,
        entry.date,
        entry.value,
        entry.meta ?? null,
        entry.loggedAt,
      ],
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
      const logs = await db.select<SqliteRow[]>(
        "SELECT * FROM habit_logs WHERE habit_id = ? AND date = ? AND deleted_at IS NULL",
        [h.id, today],
      );
      const todayValue = logs.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
      result.push({
        ...h,
        currentStreak: todayValue > 0 ? 1 : 0,
        longestStreak: 1,
        todayValue,
        completedToday: todayValue > 0,
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

  getWeeklyReview: async (_weekStart?: string): Promise<WeeklySummary> => {
    return {
      weekStart: new Date().toISOString().split("T")[0],
      totalCompletions: 0,
      overallCompletionRate: 0,
      habitSummaries: [],
    };
  },

  // --- Skills ---
  getSkillAreas: async (): Promise<SkillArea[]> => {
    const db = await getLocalDb();
    const rows = await db.select<SqliteRow[]>("SELECT * FROM skill_areas WHERE deleted_at IS NULL");
    return rows.map((r) => ({
      id: String(r.id),
      userId: String(r.user_id),
      name: String(r.name),
      category: String(r.category),
      color: r.color ? String(r.color) : undefined,
      icon: r.icon ? String(r.icon) : undefined,
      targetHours: Number(r.target_hours),
      weeklyGoalHours: Number(r.weekly_goal_hours),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));
  },

  createSkillArea: async (input: NewSkillAreaInput): Promise<SkillArea> => {
    const db = await getLocalDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const userId = getCurrentUserId();

    const area: SkillArea = {
      id,
      userId,
      name: input.name,
      category: input.category ?? "general",
      color: input.color,
      icon: input.icon,
      targetHours: input.targetHours ?? 100,
      weeklyGoalHours: input.weeklyGoalHours ?? 5,
      createdAt: now,
      updatedAt: now,
    };

    await db.execute(
      `INSERT INTO skill_areas (id, user_id, name, category, color, icon, target_hours, weekly_goal_hours, created_at, updated_at, _sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        area.id,
        area.userId,
        area.name,
        area.category,
        area.color ?? null,
        area.icon ?? null,
        area.targetHours,
        area.weeklyGoalHours,
        now,
        now,
      ],
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
      area,
      totalHoursLogged: 0,
      resourcesCount: 0,
      completedResourcesCount: 0,
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
      unit: r.unit ? String(r.unit) : undefined,
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
    const totalMinutes = logs.reduce((sum, l) => sum + (Number(l.minutes_spent) || 0), 0);
    const unitsCompleted = logs.reduce((sum, l) => sum + (Number(l.units_completed) || 0), 0);

    return {
      ...resource,
      totalMinutes,
      unitsCompleted,
      progressPercentage: resource.totalUnits
        ? Math.round((unitsCompleted / resource.totalUnits) * 100)
        : 0,
    };
  },

  logLearningSession: async (input: NewLearningLogInput): Promise<LearningLog> => {
    const db = await getLocalDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const userId = getCurrentUserId();

    const log: LearningLog = {
      id,
      userId,
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
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        log.id,
        log.userId,
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
      userId: String(r.user_id),
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
      userId: String(r.user_id),
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
        userId: String(a.user_id),
        name: String(a.name),
        type: String(a.type),
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
    const userId = getCurrentUserId();

    const account: Account = {
      id,
      userId,
      name: input.name,
      type: input.type,
      archived: false,
      createdAt: now,
      updatedAt: now,
    };

    await db.execute(
      `INSERT INTO accounts (id, user_id, name, type, archived, created_at, updated_at, _sync_status)
       VALUES (?, ?, ?, ?, 0, ?, ?, 'pending')`,
      [account.id, account.userId, account.name, account.type, now, now],
    );

    return account;
  },

  getCategories: async (): Promise<Category[]> => {
    const db = await getLocalDb();
    const rows = await db.select<SqliteRow[]>("SELECT * FROM categories WHERE deleted_at IS NULL");
    return rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      kind: r.kind as Category["kind"],
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
      userId: String(r.user_id),
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
    const userId = getCurrentUserId();

    const tx: Transaction = {
      id,
      userId,
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
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        tx.id,
        tx.userId,
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
      kind: r.kind as CategoryBreakdown["kind"],
      total: Number(r.total) || 0,
    }));
  },

  getFinanceWidget: async (): Promise<FinanceDashboardWidget> => {
    const accounts = await localDal.getAccounts();
    const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0);
    const now = new Date().toISOString().split("T")[0].substring(0, 7);
    const monthly = await localDal.getMonthlySummary(now);

    return {
      netWorth,
      monthlyIncome: monthly.totalIncome,
      monthlyExpense: monthly.totalExpense,
      currency: "BDT",
    };
  },

  // --- Dashboard Summary ---
  getSummary: async (date?: string): Promise<DashboardSummary> => {
    const today = date || new Date().toISOString().split("T")[0];
    const tasks = await localDal.getTasks(today);
    const habits = await localDal.getTodayHabits();
    const reminders = await localDal.getTodayReminders();

    const pendingTasks = tasks.filter((t) => t.status !== "done" && t.status !== "skipped");
    const completedTasks = tasks.filter((t) => t.status === "done");

    return {
      todayDate: today,
      scheduleStack: {
        now: pendingTasks[0] || null,
        next: pendingTasks[1] || null,
        previous: completedTasks[completedTasks.length - 1] || null,
      },
      habitConsistency: habits.map((h) => ({
        id: h.id,
        name: h.name,
        completedToday: h.completedToday,
        currentStreak: h.currentStreak,
        last7Days: [h.completedToday],
      })),
      weeklyWorkoutHours: [],
      skillsProgress: [],
      unreadArticlesCount: 0,
      remindersToday: reminders,
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
      userId: String(r.user_id),
      title: String(r.title),
      time: String(r.time),
      date: r.date ? String(r.date) : undefined,
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
    const userId = getCurrentUserId();

    const reminder: Reminder = {
      id,
      userId,
      title: input.title,
      time: input.time,
      date: input.date,
      kind: input.kind ?? "reminder",
      completed: 0,
      createdAt: now,
      updatedAt: now,
    };

    await db.execute(
      `INSERT INTO reminders (id, user_id, title, time, date, kind, completed, created_at, updated_at, _sync_status)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, 'pending')`,
      [
        reminder.id,
        reminder.userId,
        reminder.title,
        reminder.time,
        reminder.date ?? null,
        reminder.kind,
        now,
        now,
      ],
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
      userId: String(r.user_id),
      reminderTime: String(r.reminder_time),
      soundType: r.sound_type as NotificationWithTask["soundType"],
      status: r.status as NotificationWithTask["status"],
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
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
    const userId = getCurrentUserId();

    const notif: Notification = {
      id,
      taskId: input.taskId,
      userId,
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
    let user = { id: getCurrentUserId(), name: "", email: "" };
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
