import type {
  DashboardHabitConsistency,
  DashboardNewsItem,
  DashboardSkillProgress,
  DashboardSummary,
  DashboardWorkoutDay,
  Reminder,
} from "@lifeos/contracts";
import type { Task } from "../../routine/domain/types.js";
import type { DashboardDependencies } from "../ports/dashboard-dependencies.js";

export type { DashboardSummary } from "@lifeos/contracts";

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function extractTimeFromIso(isoString: string): string {
  const match = isoString.match(/T(\d{2}:\d{2})/);
  if (match) return match[1];
  const d = new Date(isoString);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function getTaskScheduleStack(
  tasks: Task[],
  nowIso: string,
): { previous: Task | null; now: Task | null; next: Task | null } {
  const currentTime = extractTimeFromIso(nowIso);
  const currentMinutes = timeToMinutes(currentTime);

  let nowTask: Task | null = null;
  let nextTask: Task | null = null;
  let previousTask: Task | null = null;

  const sortedTasks = [...tasks].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
  );

  // 1. First priority for "Now": any task explicitly marked "in_progress" (not done/cancelled/skipped)
  const inProgressTask = sortedTasks.find((t) => t.status === "in_progress");

  // 2. Second priority for "Now": any task currently active in its time window
  let timeActiveTask: Task | null = null;
  for (const task of sortedTasks) {
    if (task.status === "done" || task.status === "cancelled" || task.status === "skipped")
      continue;
    const start = timeToMinutes(task.startTime);
    const end = timeToMinutes(task.endTime);
    const isOvernight = task.isOvernight || start >= end;

    const isActive = isOvernight
      ? currentMinutes >= start || currentMinutes < end
      : currentMinutes >= start && currentMinutes < end;

    if (isActive) {
      timeActiveTask = task;
      break;
    }
  }

  nowTask = inProgressTask || timeActiveTask || null;

  // 3. Find Next task (earliest upcoming pending/planned task starting >= currentMinutes, not currently 'now')
  for (const task of sortedTasks) {
    if (task.status === "done" || task.status === "cancelled" || task.status === "skipped")
      continue;
    if (nowTask && task.id === nowTask.id) continue;

    const start = timeToMinutes(task.startTime);
    if (start >= currentMinutes) {
      nextTask = task;
      break;
    }
  }

  // 4. Find Previous task: the task whose time crossed most recently before now, or the most recently completed task
  const candidatePreviousTasks = sortedTasks.filter((t) => {
    if (nowTask && t.id === nowTask.id) return false;
    if (nextTask && t.id === nextTask.id) return false;
    const start = timeToMinutes(t.startTime);
    const end = timeToMinutes(t.endTime);
    const isOvernight = t.isOvernight || start >= end;

    if (t.status === "done" || t.status === "skipped") return true;
    if (isOvernight) {
      return currentMinutes >= end && currentMinutes < start;
    }
    return end <= currentMinutes || start <= currentMinutes;
  });

  if (candidatePreviousTasks.length > 0) {
    candidatePreviousTasks.sort((a, b) => {
      const endA = timeToMinutes(a.endTime);
      const endB = timeToMinutes(b.endTime);
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

  return { previous: previousTask, now: nowTask, next: nextTask };
}

export async function getDashboardSummary(
  deps: DashboardDependencies,
  nowIso: string,
  userId = "default",
): Promise<DashboardSummary> {
  const today = nowIso.slice(0, 10);
  const tasks = await deps.taskRepo.getByDate(today, userId);
  const { previous, now, next } = getTaskScheduleStack(tasks, nowIso);

  // 1. Due Habits
  const dueHabits = deps.habitLogService
    ? await deps.habitLogService.getTodayDueHabits(today, userId)
    : [];

  // 2. Upcoming Reminders
  let upcomingReminders: Reminder[] = [];
  if (deps.reminderService) {
    upcomingReminders = await deps.reminderService.getUpcomingToday(today, userId, 4);
  }

  // 3. Habit Consistency (7 days sparkline data)
  const habitConsistency: DashboardHabitConsistency[] = [];
  if (deps.habitRepo && deps.habitStatsService) {
    const activeHabits = (await deps.habitRepo.getAll(false, userId)).slice(0, 4);
    for (const habit of activeHabits) {
      const stats = await deps.habitStatsService.getAnalytics(habit.id, "week", userId, today);
      if (stats) {
        const days = stats.dailyValues.map((d: { value: number; target: number }) =>
          d.target > 0 ? Math.min(100, Math.round((d.value / d.target) * 100)) : 0,
        );
        // Ensure 7 days array
        while (days.length < 7) days.unshift(0);
        const sevenDays = days.slice(-7);
        const weekAverage = Math.round(sevenDays.reduce((a, b) => a + b, 0) / 7);

        habitConsistency.push({
          habitId: habit.id,
          name: habit.name,
          color: habit.color || "#10B981",
          days: sevenDays,
          currentStreak: stats.currentStreak,
          weekAverage,
        });
      }
    }
  }

  // 4. Workout Week Stacked Bar Data
  const workoutWeek: DashboardWorkoutDay[] = [];
  const workoutLabelsSet = new Set<string>();

  if (deps.workoutSessionRepo && deps.workoutRepo) {
    const daysName = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const nowUtc = new Date(`${today}T00:00:00Z`);
    const dayOfWeekIndex = (nowUtc.getUTCDay() + 6) % 7; // Monday = 0
    const monday = new Date(nowUtc);
    monday.setUTCDate(nowUtc.getUTCDate() - dayOfWeekIndex);

    const weekEnd = new Date(monday);
    weekEnd.setUTCDate(monday.getUTCDate() + 6);

    const mondayStr = monday.toISOString().split("T")[0];
    const weekEndStr = weekEnd.toISOString().split("T")[0];

    const allSessions = await deps.workoutSessionRepo.getAll();
    const weekSessions = allSessions.filter((s) => {
      const sessionDate = s.startedAt.slice(0, 10);
      return sessionDate >= mondayStr && sessionDate <= weekEndStr;
    });

    const workoutsMap = new Map((await deps.workoutRepo.getAll()).map((w) => [w.id, w.name]));

    // Initialize 7 days
    const dayBuckets: Record<string, Record<string, number>> = {};
    for (const day of daysName) {
      dayBuckets[day] = {};
    }

    for (const session of weekSessions) {
      const sessionDate = new Date(session.startedAt);
      const dayIndex = (sessionDate.getUTCDay() + 6) % 7;
      const dayName = daysName[dayIndex];
      const workoutName = workoutsMap.get(session.workoutId) || "Workout";
      workoutLabelsSet.add(workoutName);

      const mins = session.durationSeconds ? Math.round(session.durationSeconds / 60) : 30;
      dayBuckets[dayName][workoutName] = (dayBuckets[dayName][workoutName] || 0) + mins;
    }

    for (const day of daysName) {
      const entry: DashboardWorkoutDay = { day };
      for (const [name, mins] of Object.entries(dayBuckets[day])) {
        entry[name] = mins;
      }
      workoutWeek.push(entry);
    }
  }

  // 5. Skills Progress
  const skillsProgress: DashboardSkillProgress[] = [];
  if (deps.skillAreaService && deps.learningLogService) {
    const areas = (await deps.skillAreaService.list()).slice(0, 4);
    const nowUtc = new Date(`${today}T00:00:00Z`);
    const dayOfWeekIndex = (nowUtc.getUTCDay() + 6) % 7;
    const monday = new Date(nowUtc);
    monday.setUTCDate(nowUtc.getUTCDate() - dayOfWeekIndex);
    const mondayStr = monday.toISOString().split("T")[0];

    for (const area of areas) {
      const summary = await deps.learningLogService.getSkillAreaSummary(area.id, mondayStr, today);
      const hoursThisWeek = summary ? Math.round((summary.totalMinutesSpent / 60) * 10) / 10 : 0;
      const goal = area.weeklyGoalHours || 5;
      const pct = Math.min(100, Math.round((hoursThisWeek / goal) * 100));

      skillsProgress.push({
        skillAreaId: area.id,
        name: area.name,
        hoursThisWeek,
        weeklyGoalHours: goal,
        pct,
      });
    }
  }

  // 6. News Ticker Items
  const newsItems: DashboardNewsItem[] = [];
  if (deps.newsArticleRepo && deps.rssFeedRepo) {
    const articles = await deps.newsArticleRepo.getRecent(5);
    const feedsMap = new Map((await deps.rssFeedRepo.getAll()).map((f) => [f.id, f.title]));

    for (const article of articles) {
      const feedTitle = feedsMap.get(article.feedId) || "tech";
      const shortSource = feedTitle.toLowerCase().split(" ")[0].slice(0, 10);

      newsItems.push({
        id: article.id,
        source: shortSource,
        title: article.title,
        url: article.url,
        publishedAt: article.publishedAt || null,
      });
    }
  }

  return {
    now,
    next,
    previous,
    todayCount: tasks.length,
    todayDoneCount: tasks.filter((t) => t.status === "done").length,
    dueHabits,
    upcomingReminders,
    habitConsistency,
    workoutWeek,
    workoutLabels: Array.from(workoutLabelsSet),
    skillsProgress,
    newsItems,
  };
}
