import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppToast } from "../../components/Toast";
import { api } from "../../lib/api";
import BackupPanel from "./BackupPanel";
import CategoryForm from "./CategoryForm";
import CategoryList from "./CategoryList";
import ConfirmDialog from "./ConfirmDialog";
import CourseForm from "./CourseForm";
import CourseList from "./CourseList";
import SessionForm from "./SessionForm";
import SessionList from "./SessionList";
import type {
  LearningLog,
  LearningResource,
  NewLearningLogInput,
  NewLearningResourceInput,
  NewSkillAreaInput,
  ResourceWithProgress,
  SkillArea,
} from "./types";
import { useLearningLogs } from "./useLearningLogs";
import { useLearningResources } from "./useLearningResources";
import { useSkillAreas } from "./useSkillCategories";

type Tab = "sessions" | "courses" | "categories" | "backup";

export default function SkillsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useAppToast();

  const [activeTab, setActiveTab] = useState<Tab>("sessions");
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

  const tabs: { id: Tab; label: string }[] = [
    { id: "sessions", label: "Sessions" },
    { id: "courses", label: "Resources" },
    { id: "categories", label: "Areas" },
    { id: "backup", label: "Backup" },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700/50 rounded w-1/4" />
          <div className="h-4 bg-gray-700/50 rounded w-1/3" />
          <div className="space-y-3">
            <div className="h-20 bg-gray-700/50 rounded-xl" />
            <div className="h-20 bg-gray-700/50 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Skills</h1>
        <p className="text-sm text-gray-500 mt-1">Track your learning journey</p>
      </div>

      <div className="flex gap-1 p-1 bg-gray-800/60 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {(resourcesError || sessionsError || categoriesError) && (
        <div className="p-4 bg-red-900/20 border border-red-600/30 rounded-xl">
          <p className="text-sm text-red-400">Failed to load data. Please refresh the page.</p>
        </div>
      )}

      {activeTab === "sessions" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-200">Learning Sessions</h2>
            <button
              type="button"
              onClick={() => {
                setEditingSession(null);
                setShowSessionForm(true);
              }}
              className="px-4 py-2 text-sm bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-600/30 transition-colors"
            >
              Log Session
            </button>
          </div>

          {showSessionForm && (
            <div className="mb-6 p-4 bg-gray-800/40 border border-gray-700/50 rounded-xl">
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
            </div>
          )}

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
      )}

      {activeTab === "courses" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-200">Learning Resources</h2>
            <button
              type="button"
              onClick={() => {
                setEditingCourse(null);
                setShowCourseForm(true);
              }}
              className="px-4 py-2 text-sm bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-600/30 transition-colors"
            >
              Add Resource
            </button>
          </div>

          {showCourseForm && (
            <div className="mb-6 p-4 bg-gray-800/40 border border-gray-700/50 rounded-xl">
              <CourseForm
                resource={editingCourse ?? undefined}
                areas={areas}
                onSubmit={handleCourseSubmit}
                onCancel={() => {
                  setShowCourseForm(false);
                  setEditingCourse(null);
                }}
              />
            </div>
          )}

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
      )}

      {activeTab === "categories" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-200">Skill Areas</h2>
            <button
              type="button"
              onClick={() => {
                setEditingCategory(null);
                setShowCategoryForm(true);
              }}
              className="px-4 py-2 text-sm bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-600/30 transition-colors"
            >
              Create Area
            </button>
          </div>

          {showCategoryForm && (
            <div className="mb-6 p-4 bg-gray-800/40 border border-gray-700/50 rounded-xl">
              <CategoryForm
                category={editingCategory ?? undefined}
                onSubmit={handleCategorySubmit}
                onCancel={() => {
                  setShowCategoryForm(false);
                  setEditingCategory(null);
                }}
              />
            </div>
          )}

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
      )}

      {activeTab === "backup" && (
        <div>
          <h2 className="text-lg font-semibold text-gray-200 mb-4">Backup & Export</h2>
          <BackupPanel
            onImportComplete={() => {
              refreshLogs();
              refreshAreas();
              refreshResources();
            }}
          />
        </div>
      )}

      {deleteConfirmation && (
        <ConfirmDialog
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
