import { Activity, BookOpen, Clock, Target } from "lucide-react";
import { ProgressBar } from "../../../components/ui/ProgressBar.js";
import { Skeleton } from "../../../components/ui/Skeleton.js";
import { StatCard } from "../../../components/ui/StatCard.js";
import { useLearningLogs } from "../hooks/useLearningLogs.js";
import { useLearningResources } from "../hooks/useLearningResources.js";
import { useSkillAreas } from "../hooks/useSkillCategories.js";
import type { ResourceWithProgress } from "../types.js";
import { LearningChart } from "./LearningChart.js";

export function SkillsDashboard({
  progresses = {},
}: {
  progresses?: Record<string, ResourceWithProgress | null>;
}) {
  const { logs, loading: logsLoading } = useLearningLogs();
  const { resources, loading: resourcesLoading } = useLearningResources();
  const { loading: areasLoading } = useSkillAreas();

  const loading = logsLoading || resourcesLoading || areasLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  const totalMinutes = logs.reduce((sum, l) => sum + l.minutesSpent, 0);
  const activeResources = resources.filter((r) => {
    const prog = progresses[r.id]?.completionPercent ?? 0;
    return prog > 0 && prog < 100;
  });

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Time"
          value={totalMinutes}
          format={(v) => formatDuration(v)}
          icon={Clock}
        />
        <StatCard label="Resources" value={resources.length} icon={BookOpen} />
        <StatCard label="Active" value={activeResources.length} icon={Activity} />
        <StatCard label="Sessions" value={logs.length} icon={Target} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="md:col-span-2 p-6 rounded-xl glass flex flex-col">
          <div>
            <h3 className="text-sm font-semibold text-primary">Learning Activity</h3>
            <p className="text-xs text-muted mt-1">Time spent learning over the last 7 days</p>
          </div>
          <div className="flex-1 min-h-62.5">
            <LearningChart logs={logs} />
          </div>
        </div>

        {/* Active Resources */}
        <div className="p-6 rounded-xl glass flex flex-col h-87.5">
          <div>
            <h3 className="text-sm font-semibold text-primary">Active Resources</h3>
            <p className="text-xs text-muted mt-1">Continue where you left off</p>
          </div>
          <div className="mt-6 space-y-5 overflow-y-auto pr-2 scrollbar-hide flex-1">
            {activeResources.length === 0 ? (
              <p className="text-xs text-muted text-center py-4">No active resources</p>
            ) : (
              activeResources.map((resource) => (
                <div key={resource.id} className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm font-medium text-primary line-clamp-1 flex-1">
                      {resource.title}
                    </p>
                    <span className="text-[10px] uppercase font-bold text-accent tracking-wider bg-accent-muted px-1.5 py-0.5 rounded">
                      {resource.type}
                    </span>
                  </div>
                  <ProgressBar
                    value={progresses[resource.id]?.completionPercent ?? 0}
                    size="sm"
                    showLabel
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
