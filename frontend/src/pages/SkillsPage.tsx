import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppToast } from "../components/Toast.js";
import BackupPanel from "../components/ui/BackupPanel.js";
import { PageHeader } from "../components/ui/PageHeader.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/Tabs.js";
import { getDataSource } from "../lib/dataSource.js";
import {
  exportBackup,
  importBackup,
  markBackupCompleted,
  shouldShowBackupReminder,
} from "../modules/skills/backup.js";
import CategoriesTab from "../modules/skills/components/CategoriesTab.js";
import CoursesTab from "../modules/skills/components/CoursesTab.js";
import SessionsTab from "../modules/skills/components/SessionsTab.js";
import { SkillsDashboard } from "../modules/skills/components/SkillsDashboard.js";
import { useLearningLogs } from "../modules/skills/hooks/useLearningLogs.js";
import { useLearningResources } from "../modules/skills/hooks/useLearningResources.js";
import { useSkillAreas } from "../modules/skills/hooks/useSkillCategories.js";
import type { ResourceWithProgress } from "../modules/skills/types.js";

type Tab = "overview" | "sessions" | "resources" | "areas" | "backup";

export default function SkillsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useAppToast();

  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Routine task automation query state
  const [automationTaskId, setAutomationTaskId] = useState<string | null>(null);
  const [initialLogResourceId, setInitialLogResourceId] = useState<string | undefined>(undefined);
  const [initialLogMinutes, setInitialLogMinutes] = useState<number | undefined>(undefined);

  const {
    logs,
    loading: sessionsLoading,
    error: sessionsError,
    addLog,
    editLog,
    removeLog,
    refresh: refreshLogs,
  } = useLearningLogs();

  const {
    areas,
    loading: categoriesLoading,
    error: categoriesError,
    addArea,
    editArea,
    removeArea,
    refresh: refreshAreas,
  } = useSkillAreas();

  const {
    resources,
    loading: resourcesLoading,
    error: resourcesError,
    addResource,
    editResource,
    removeResource,
    refresh: refreshResources,
  } = useLearningResources();

  // Batch progress data loaded and updated when resources or logs change
  const [progressesByResource, setProgressesByResource] = useState<
    Record<string, ResourceWithProgress | null>
  >({});

  const refreshProgresses = useCallback(async () => {
    if (resources.length === 0) {
      setProgressesByResource({});
      return;
    }
    const ids = resources.map((r) => r.id);
    try {
      const ds = getDataSource();
      const progArr = await ds.getProgressBatch(ids);
      const byId: Record<string, ResourceWithProgress | null> = {};
      for (const p of progArr) {
        if (p) byId[p.id] = p;
      }
      for (const r of resources) {
        if (!(r.id in byId)) byId[r.id] = null;
      }
      setProgressesByResource(byId);
    } catch (err) {
      console.error("Failed to load progress batch:", err);
    }
  }, [resources]);

  useEffect(() => {
    refreshProgresses();
  }, [refreshProgresses]);

  const loading = sessionsLoading || categoriesLoading || resourcesLoading;

  const [resourceCounts, setResourceCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const counts: Record<string, number> = {};
    for (const r of resources) {
      counts[r.skillAreaId] = (counts[r.skillAreaId] ?? 0) + 1;
    }
    setResourceCounts(counts);
  }, [resources]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const logSessionId = searchParams.get("logSession");
    const taskId = searchParams.get("taskId");
    const durationStr = searchParams.get("duration");

    if (logSessionId) {
      setActiveTab("sessions");
      setInitialLogResourceId(logSessionId);
      if (durationStr && !Number.isNaN(Number(durationStr))) {
        setInitialLogMinutes(Number(durationStr));
      }
      if (taskId) {
        setAutomationTaskId(taskId);
        getDataSource().updateTaskStatus(taskId, "in_progress").catch(console.error);
      }
      navigate("/skills", { replace: true });
    }
  }, [location.search, navigate]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-card rounded w-1/4" />
          <div className="h-4 bg-card rounded w-1/3" />
          <div className="space-y-3 mt-8">
            <div className="h-20 bg-card rounded-xl" />
            <div className="h-20 bg-card rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Skills" description="Track your learning journey and level up" />

      {(resourcesError || sessionsError || categoriesError) && (
        <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl">
          <p className="text-sm text-danger">Failed to load data. Please refresh the page.</p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} variant="underline">
        <TabsList className="w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="areas">Areas</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SkillsDashboard
            logs={logs}
            resources={resources}
            loading={loading}
            progresses={progressesByResource}
          />
        </TabsContent>

        <TabsContent value="sessions">
          <SessionsTab
            logs={logs}
            resources={resources}
            initialLogResourceId={initialLogResourceId}
            initialLogMinutes={initialLogMinutes}
            automationTaskId={automationTaskId}
            onClearAutomationTask={() => setAutomationTaskId(null)}
            onAddLog={addLog}
            onEditLog={editLog}
            onRemoveLog={removeLog}
            onLogSuccess={() => toast.success("Learning session logged and task marked complete!")}
          />
        </TabsContent>

        <TabsContent value="resources">
          <CoursesTab
            resources={resources}
            areas={areas}
            progresses={progressesByResource}
            onAddResource={addResource}
            onEditResource={editResource}
            onRemoveResource={removeResource}
          />
        </TabsContent>

        <TabsContent value="areas">
          <CategoriesTab
            areas={areas}
            resourceCounts={resourceCounts}
            onAddArea={addArea}
            onEditArea={editArea}
            onRemoveArea={removeArea}
          />
        </TabsContent>

        <TabsContent value="backup">
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-semibold text-primary">Backup & Export</h2>
              <p className="text-sm text-muted mt-1">
                Export your learning data to a JSON file or restore from a backup.
              </p>
            </div>
            <BackupPanel
              entityName="Learning"
              header={
                shouldShowBackupReminder() ? (
                  <div className="p-4 bg-warning/20 border border-warning/30 rounded-xl">
                    <p className="text-sm text-warning">
                      <strong>Backup reminder:</strong> Consider exporting your data to prevent
                      loss.
                    </p>
                  </div>
                ) : undefined
              }
              onExportJson={async () => {
                const data = await exportBackup();
                markBackupCompleted();
                return data;
              }}
              onImportJson={async (data) => {
                const result = await importBackup(data);
                if (result.success) {
                  refreshLogs();
                  refreshAreas();
                  refreshResources();
                }
                return result;
              }}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
