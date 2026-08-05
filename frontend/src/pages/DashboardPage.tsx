import { useNavigate } from "react-router-dom";
import ErrorBanner from "../components/ui/ErrorBanner.js";
import { useDashboard } from "../modules/dashboard/hooks/useDashboard.js";
import {
  HabitCarouselWidget,
  HabitConsistencyWidget,
  NewsWidget,
  RemindersWidget,
  ScheduleWidget,
  SkillsProgressWidget,
  StatusBar,
  WorkoutChartWidget,
} from "../modules/dashboard/widgets/index.js";

export default function DashboardPage() {
  const {
    summary,
    loading,
    error,
    refresh,
    logHabit,
    unlogHabit,
    completeReminder,
    createReminder,
  } = useDashboard();

  const navigate = useNavigate();

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex flex-col h-auto lg:h-[calc(100dvh-9.5rem)] lg:max-h-[calc(100dvh-9.5rem)] animate-fade-in gap-3 overflow-visible lg:overflow-hidden">
      {/* Header Status Bar */}
      <StatusBar loading={loading} onRefresh={refresh} />

      {error && (
        <div className="shrink-0">
          <ErrorBanner message={error} onRetry={refresh} />
        </div>
      )}

      {/* Responsive Grid Layout: 1 col on mobile, 2 cols on tablet (scrollable), 4 cols x 2 rows on desktop (100dvh non-scrolling) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-3.5 min-h-0 overflow-visible lg:overflow-hidden pb-6 lg:pb-0">
        {/* ROW 1 */}
        {/* Schedule Stack (Spans 2 cols on tablet & desktop) */}
        <div className="md:col-span-2 lg:col-span-2 min-h-0 flex flex-col">
          <ScheduleWidget
            previous={summary?.previous ?? null}
            now={summary?.now ?? null}
            next={summary?.next ?? null}
            onNavigate={navigate}
          />
        </div>

        {/* Reminders & Events */}
        <div className="min-h-0 flex flex-col">
          <RemindersWidget
            reminders={summary?.upcomingReminders ?? []}
            onComplete={completeReminder}
            onAdd={createReminder}
          />
        </div>

        {/* Habit Log Carousel */}
        <div className="min-h-0 flex flex-col">
          <HabitCarouselWidget
            habits={summary?.dueHabits ?? []}
            onLog={logHabit}
            onUnlog={unlogHabit}
          />
        </div>

        {/* ROW 2 */}
        {/* Habit Consistency Sparklines */}
        <div className="min-h-0 flex flex-col">
          <HabitConsistencyWidget habits={summary?.habitConsistency ?? []} />
        </div>

        {/* Workout Stacked Column Chart */}
        <div className="min-h-0 flex flex-col">
          <WorkoutChartWidget
            data={summary?.workoutWeek ?? []}
            labels={summary?.workoutLabels ?? []}
          />
        </div>

        {/* Skills Progress */}
        <div className="min-h-0 flex flex-col">
          <SkillsProgressWidget skills={summary?.skillsProgress ?? []} />
        </div>

        {/* Tech News Catch-up */}
        <div className="min-h-0 flex flex-col">
          <NewsWidget items={summary?.newsItems ?? []} />
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col h-auto lg:h-[calc(100dvh-9.5rem)] animate-pulse gap-3 overflow-hidden">
      <div className="flex items-center justify-between h-10 px-1">
        <div className="h-6 w-48 bg-card-solid rounded-md" />
        <div className="h-6 w-24 bg-card-solid rounded-md" />
      </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-3.5 min-h-0">
        <div className="md:col-span-2 lg:col-span-2 h-48 lg:h-auto bg-card-solid/60 rounded-xl" />
        <div className="h-48 lg:h-auto bg-card-solid/60 rounded-xl" />
        <div className="h-48 lg:h-auto bg-card-solid/60 rounded-xl" />
        <div className="h-48 lg:h-auto bg-card-solid/60 rounded-xl" />
        <div className="h-48 lg:h-auto bg-card-solid/60 rounded-xl" />
        <div className="h-48 lg:h-auto bg-card-solid/60 rounded-xl" />
        <div className="h-48 lg:h-auto bg-card-solid/60 rounded-xl" />
      </div>
    </div>
  );
}
