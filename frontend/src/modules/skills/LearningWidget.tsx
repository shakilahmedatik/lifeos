import { useLearningLogs } from "./useLearningLogs";
import { useLearningResources } from "./useLearningResources";
import { useSkillAreas } from "./useSkillCategories";

interface LearningWidgetProps {
  onViewAll: () => void;
}

export default function LearningWidget({ onViewAll }: LearningWidgetProps) {
  const { logs, loading: logsLoading } = useLearningLogs();
  const { resources, loading: resourcesLoading } = useLearningResources();
  const { loading: areasLoading } = useSkillAreas();

  const loading = logsLoading || resourcesLoading || areasLoading;

  if (loading) {
    return (
      <div className="p-4 bg-gray-800/40 rounded-xl border border-gray-700/50">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-700/50 rounded w-1/4" />
          <div className="h-3 bg-gray-700/50 rounded w-1/2" />
          <div className="h-3 bg-gray-700/50 rounded w-1/3" />
        </div>
      </div>
    );
  }

  const totalMinutes = logs.reduce((sum, l) => sum + l.minutesSpent, 0);
  const recentLogs = logs.slice(0, 5);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  if (logs.length === 0 && resources.length === 0) {
    return (
      <div className="p-4 bg-gray-800/40 rounded-xl border border-gray-700/50">
        <h3 className="text-sm font-medium text-gray-200 mb-2">Learning</h3>
        <p className="text-gray-500 text-xs">
          No learning data yet. Start by logging a session or adding a resource!
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800/40 rounded-xl border border-gray-700/50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-gray-200">Learning</h3>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          View All
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <p className="text-xl font-bold text-gray-100">{formatDuration(totalMinutes)}</p>
          <p className="text-xs text-gray-500">Total Time</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-gray-100">{resources.length}</p>
          <p className="text-xs text-gray-500">Resources</p>
        </div>
      </div>

      {recentLogs.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-400 mb-2">Recent Sessions</h4>
          <div className="space-y-2">
            {recentLogs.map((log) => {
              const resource = resources.find((r) => r.id === log.resourceId);
              return (
                <div key={log.id} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300">{formatDuration(log.minutesSpent)}</span>
                    {resource && (
                      <span className="px-1.5 py-0.5 bg-blue-600/20 text-blue-400 rounded-full text-[10px]">
                        {resource.title}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-600">
                    {new Date(log.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
