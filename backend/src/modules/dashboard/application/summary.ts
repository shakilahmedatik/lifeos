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

export function getTaskScheduleStack(
  tasks: Task[],
  nowIso: string,
): { previous: Task | null; now: Task | null; next: Task | null } {
  const now = new Date(nowIso);
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const currentMinutes = timeToMinutes(currentTime);

  let nowTask: Task | null = null;
  let nextTask: Task | null = null;
  let previousTask: Task | null = null;

  const sortedTasks = [...tasks].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
  );

  for (const task of sortedTasks) {
    const start = timeToMinutes(task.startTime);
    const end = timeToMinutes(task.endTime);

    if (currentMinutes >= start && currentMinutes < end) {
      nowTask = task;
    } else if (start > currentMinutes && !nextTask) {
      nextTask = task;
    }
  }

  // Find previous task: most recent done task before now, or task whose end time passed
  const passedTasks = sortedTasks.filter((t) => timeToMinutes(t.endTime) <= currentMinutes);
  if (passedTasks.length > 0) {
    const donePassed = passedTasks.filter((t) => t.status === "done");
    previousTask =
      donePassed.length > 0
        ? donePassed[donePassed.length - 1]
        : passedTasks[passedTasks.length - 1];
  }

  return { previous: previousTask, now: nowTask, next: nextTask };
}

export function getDashboardSummary(deps: DashboardDependencies, nowIso: string): DashboardSummary {
  const today = nowIso.slice(0, 10);
  const tasks = deps.taskRepo.getByDate(today);
  const { previous, now, next } = getTaskScheduleStack(tasks, nowIso);

  // 1. Due Habits
  const dueHabits = deps.habitLogService ? deps.habitLogService.getTodayDueHabits(today) : [];

  // 2. Upcoming Reminders
  let upcomingReminders: Reminder[] = [];
  if (deps.reminderService) {
    upcomingReminders = deps.reminderService.getUpcomingToday(today, 4);
  }

  // 3. Habit Consistency (7 days sparkline data)
  const habitConsistency: DashboardHabitConsistency[] = [];
  if (deps.habitRepo && deps.habitStatsService) {
    const activeHabits = deps.habitRepo.getAll(false).slice(0, 4);
    for (const habit of activeHabits) {
      const stats = deps.habitStatsService.getAnalytics(habit.id, "week");
      if (stats) {
        const days = stats.dailyValues.map((d) =>
          d.target > 0 ? Math.min(100, Math.round((d.value / d.target) * 100)) : 0,
        );
        habitConsistency.push({
          habitId: habit.id,
          name: habit.name,
          color: habit.color || "#fbbf24",
          days,
          currentStreak: stats.currentStreak,
          weekAverage: stats.completionRate,
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

    const allSessions = deps.workoutSessionRepo.getAll();
    const weekSessions = allSessions.filter((s) => {
      const sessionDate = s.startedAt.slice(0, 10);
      return sessionDate >= mondayStr && sessionDate <= weekEndStr;
    });

    const workoutsMap = new Map(deps.workoutRepo.getAll().map((w) => [w.id, w.name]));

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
    const areas = deps.skillAreaService.list().slice(0, 4);
    const nowUtc = new Date(`${today}T00:00:00Z`);
    const dayOfWeekIndex = (nowUtc.getUTCDay() + 6) % 7;
    const monday = new Date(nowUtc);
    monday.setUTCDate(nowUtc.getUTCDate() - dayOfWeekIndex);
    const _mondayStr = monday.toISOString().split("T")[0];

    for (const area of areas) {
      const summary = deps.learningLogService.getSkillAreaSummary(area.id);
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
    const articles = deps.newsArticleRepo.getRecent(5);
    const feedsMap = new Map(deps.rssFeedRepo.getAll().map((f) => [f.id, f.title]));

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
