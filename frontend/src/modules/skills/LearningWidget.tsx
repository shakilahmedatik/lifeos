import { BookOpen, ChevronRight, Clock } from "lucide-react";
import Card from "../../components/ui/Card.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Skeleton } from "../../components/ui/Skeleton.js";
import { StatCard } from "../../components/ui/StatCard.js";
import { useLearningLogs } from "./hooks/useLearningLogs.js";
import { useLearningResources } from "./hooks/useLearningResources.js";
import { useSkillAreas } from "./hooks/useSkillCategories.js";
import { formatLocalDate } from "./utils/date-utils.js";

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
      <Card className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </Card>
    );
  }

  const totalMinutes = logs.reduce((sum, l) => sum + l.minutesSpent, 0);
  const recentLogs = logs.slice(0, 5);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  if (logs.length === 0 && resources.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-primary">Learning</h3>
        </div>
        <EmptyState
          icon={BookOpen}
          title="No learning data"
          description="Start tracking your progress by logging a session."
        />
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-primary">Learning</h3>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-medium text-accent hover:text-accent-hover transition-colors inline-flex items-center gap-1"
        >
          View All <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard
          label="Total Time"
          value={totalMinutes}
          format={formatDuration}
          icon={Clock}
          className="p-3 shadow-none border border-border"
        />
        <StatCard
          label="Resources"
          value={resources.length}
          icon={BookOpen}
          className="p-3 shadow-none border border-border"
        />
      </div>

      {recentLogs.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
            Recent Sessions
          </h4>
          <div className="space-y-3">
            {recentLogs.map((log) => {
              const resource = resources.find((r) => r.id === log.resourceId);
              return (
                <div key={log.id} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-primary">
                      {formatDuration(log.minutesSpent)}
                    </span>
                    {resource && (
                      <span className="px-1.5 py-0.5 bg-accent-muted text-accent rounded uppercase font-bold tracking-wider text-[10px] line-clamp-1 max-w-30">
                        {resource.title}
                      </span>
                    )}
                  </div>
                  <span className="text-muted">
                    {formatLocalDate(log.date, {
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
    </Card>
  );
}
