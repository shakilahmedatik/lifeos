import { Clock, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppToast } from "../../components/Toast.js";
import Button from "../../components/ui/Button.js";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog.js";
import Modal from "../../components/ui/Modal.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/Tabs.js";
import { api } from "../../lib/api.js";
import BackupPanel from "./components/BackupPanel.js";
import CategoryForm from "./components/CategoryForm.js";
import CategoryList from "./components/CategoryList.js";
import CourseForm from "./components/CourseForm.js";
import CourseList from "./components/CourseList.js";
import SessionForm from "./components/SessionForm.js";
import SessionList from "./components/SessionList.js";
import { SkillsDashboard } from "./components/SkillsDashboard.js";
import { useLearningLogs } from "./hooks/useLearningLogs.js";
import { useLearningResources } from "./hooks/useLearningResources.js";
import { useSkillAreas } from "./hooks/useSkillCategories.js";
import type {
  LearningLog,
  LearningResource,
  NewLearningLogInput,
  NewLearningResourceInput,
  NewSkillAreaInput,
  ResourceWithProgress,
  SkillArea,
} from "./types.js";

type Tab = "dashboard" | "sessions" | "courses" | "categories" | "backup";

export default function SkillsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useAppToast();

  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [editingSession, setEditingSession] = useState<LearningLog | null>(null);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<LearningResource | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SkillArea | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: "session" | "course" | "category";
    id: string;
    name: string;
  } | null>(null);

  // Routine task automation state
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

  // Batch progress data loaded once
  const [progressesByResource, setProgressesByResource] = useState<
    Record<string, ResourceWithProgress | null>
  >({});
  const [progressesLoaded, setProgressesLoaded] = useState(false);

  useEffect(() => {
    if (resources.length > 0 && !progressesLoaded) {
      const ids = resources.map((r) => r.id);
      api
        .getProgressBatch(ids)
        .then((progArr) => {
          const byId: Record<string, ResourceWithProgress | null> = {};
          for (const p of progArr) {
            if (p) byId[p.id] = p;
          }
          for (const r of resources) {
            if (!(r.id in byId)) byId[r.id] = null;
          }
          setProgressesByResource(byId);
          setProgressesLoaded(true);
        })
        .catch(() => {
          setProgressesLoaded(true);
        });
    }
  }, [resources, progressesLoaded]);

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
        api.updateTaskStatus(taskId, "in_progress").catch(console.error);
      }
      setEditingSession(null);
      setShowSessionForm(true);
      navigate("/skills", { replace: true });
    }
  }, [location.search, navigate]);

  const handleSessionSubmit = async (input: NewLearningLogInput) => {
    if (editingSession) {
      await editLog(editingSession.id, input);
      setEditingSession(null);
    } else {
      await addLog(input);
      if (automationTaskId) {
        await api.updateTaskStatus(automationTaskId, "done").catch(console.error);
        toast.success("Learning session logged and task marked complete!");
        setAutomationTaskId(null);
      }
    }
    setShowSessionForm(false);
    setInitialLogResourceId(undefined);
    setInitialLogMinutes(undefined);
  };

  const handleCourseSubmit = async (input: NewLearningResourceInput) => {
    if (editingCourse) {
      await editResource(editingCourse.id, input);
      setEditingCourse(null);
    } else {
      await addResource(input);
    }
    setShowCourseForm(false);
  };

  const handleCategorySubmit = async (input: NewSkillAreaInput) => {
    if (editingCategory) {
      await editArea(editingCategory.id, input);
      setEditingCategory(null);
    } else {
      await addArea(input);
    }
    setShowCategoryForm(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation) return;

    switch (deleteConfirmation.type) {
      case "session":
        await removeLog(deleteConfirmation.id);
        break;
      case "course":
        await removeResource(deleteConfirmation.id);
        break;
      case "category":
        await removeArea(deleteConfirmation.id);
        break;
    }
    setDeleteConfirmation(null);
  };

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Skills</h1>
        <p className="text-sm text-muted mt-1">Track your learning journey and level up</p>
      </div>

      {(resourcesError || sessionsError || categoriesError) && (
        <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl">
          <p className="text-sm text-danger">Failed to load data. Please refresh the page.</p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} variant="underline">
        <TabsList className="mb-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="courses">Resources</TabsTrigger>
          <TabsTrigger value="categories">Areas</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <SkillsDashboard progresses={progressesByResource} />
        </TabsContent>

        <TabsContent value="sessions">
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-primary">Learning Sessions</h2>
              <Button
                icon={<Clock size={16} />}
                onClick={() => {
                  setEditingSession(null);
                  setShowSessionForm(true);
                }}
              >
                Log Session
              </Button>
            </div>

            <Modal
              open={showSessionForm}
              onClose={() => {
                if (automationTaskId) {
                  api.updateTaskStatus(automationTaskId, "planned").catch(console.error);
                  setAutomationTaskId(null);
                }
                setShowSessionForm(false);
                setEditingSession(null);
                setInitialLogResourceId(undefined);
                setInitialLogMinutes(undefined);
              }}
              title={editingSession ? "Edit Session" : "Log Session"}
            >
              <SessionForm
                log={editingSession ?? undefined}
                resources={resources}
                initialResourceId={initialLogResourceId}
                initialMinutesSpent={initialLogMinutes}
                onSubmit={handleSessionSubmit}
                onCancel={() => {
                  if (automationTaskId) {
                    api.updateTaskStatus(automationTaskId, "planned").catch(console.error);
                    setAutomationTaskId(null);
                  }
                  setShowSessionForm(false);
                  setEditingSession(null);
                  setInitialLogResourceId(undefined);
                  setInitialLogMinutes(undefined);
                }}
              />
            </Modal>

            <SessionList
              logs={logs}
              resources={resources}
              onEdit={(log) => {
                setEditingSession(log);
                setShowSessionForm(true);
              }}
              onDelete={(id) => {
                const log = logs.find((l) => l.id === id);
                const resource = resources.find((r) => r.id === log?.resourceId);
                setDeleteConfirmation({
                  type: "session",
                  id,
                  name: `Session on ${log?.date ?? "unknown date"}${resource ? ` (${resource.title})` : ""}`,
                });
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="courses">
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-primary">Learning Resources</h2>
              <Button
                icon={<Plus size={16} />}
                onClick={() => {
                  setEditingCourse(null);
                  setShowCourseForm(true);
                }}
              >
                Add Resource
              </Button>
            </div>

            <Modal
              open={showCourseForm}
              onClose={() => {
                setShowCourseForm(false);
                setEditingCourse(null);
              }}
              title={editingCourse ? "Edit Resource" : "Add Resource"}
            >
              <CourseForm
                resource={editingCourse ?? undefined}
                areas={areas}
                onSubmit={handleCourseSubmit}
                onCancel={() => {
                  setShowCourseForm(false);
                  setEditingCourse(null);
                }}
              />
            </Modal>

            <CourseList
              resources={resources}
              progresses={progressesByResource}
              onEdit={(resource) => {
                setEditingCourse(resource);
                setShowCourseForm(true);
              }}
              onDelete={(id) => {
                const resource = resources.find((r) => r.id === id);
                setDeleteConfirmation({
                  type: "course",
                  id,
                  name: resource?.title ?? "Resource",
                });
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-primary">Skill Areas</h2>
              <Button
                icon={<Plus size={16} />}
                onClick={() => {
                  setEditingCategory(null);
                  setShowCategoryForm(true);
                }}
              >
                Create Area
              </Button>
            </div>

            <Modal
              open={showCategoryForm}
              onClose={() => {
                setShowCategoryForm(false);
                setEditingCategory(null);
              }}
              title={editingCategory ? "Edit Skill Area" : "Create Skill Area"}
            >
              <CategoryForm
                category={editingCategory ?? undefined}
                onSubmit={handleCategorySubmit}
                onCancel={() => {
                  setShowCategoryForm(false);
                  setEditingCategory(null);
                }}
              />
            </Modal>

            <CategoryList
              categories={areas}
              resourceCounts={resourceCounts}
              onEdit={(category) => {
                setEditingCategory(category);
                setShowCategoryForm(true);
              }}
              onDelete={(id) => {
                const category = areas.find((a) => a.id === id);
                setDeleteConfirmation({
                  type: "category",
                  id,
                  name: category?.name ?? "Area",
                });
              }}
            />
          </div>
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
              onImportComplete={() => {
                refreshLogs();
                refreshAreas();
                refreshResources();
              }}
            />
          </div>
        </TabsContent>
      </Tabs>

      {deleteConfirmation && (
        <ConfirmDialog
          open={!!deleteConfirmation}
          title={`Delete ${deleteConfirmation.type}`}
          message={`Are you sure you want to delete "${deleteConfirmation.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirmation(null)}
        />
      )}
    </div>
  );
}
