import { getLearningStats } from "./storage";
import { useCourseProgress } from "./useCourseProgress";
import { useLearningSessions } from "./useLearningSessions";
import { useSkillCategories } from "./useSkillCategories";

interface LearningWidgetProps {
  onViewAllSessions: () => void;
}

export default function LearningWidget({ onViewAllSessions }: LearningWidgetProps) {
  const { sessions, loading: sessionsLoading } = useLearningSessions();
  const { courses, loading: coursesLoading } = useCourseProgress();
  const { categories, loading: categoriesLoading } = useSkillCategories();

  const loading = sessionsLoading || coursesLoading || categoriesLoading;

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded" />
            <div className="h-3 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  const stats = getLearningStats();
  const recentSessions = sessions.slice(0, 5);

  const getCategoryById = (id: string) => categories.find((c) => c.id === id);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (sessions.length === 0 && courses.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Learning</h3>
        <p className="text-gray-500 text-sm">
          No learning data yet. Start by logging a session or adding a course!
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Learning</h3>
        <button
          type="button"
          onClick={onViewAllSessions}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          View All
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{formatDuration(stats.totalMinutes)}</p>
          <p className="text-xs text-gray-500">Total Time</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.activeCourses}</p>
          <p className="text-xs text-gray-500">Active Courses</p>
        </div>
      </div>

      {recentSessions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Sessions</h4>
          <div className="space-y-2">
            {recentSessions.map((session) => {
              const category = getCategoryById(session.skillCategoryId);
              return (
                <div key={session.id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900">{formatDuration(session.duration)}</span>
                    {category && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {category.name}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-500">{formatDate(session.timestamp)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
