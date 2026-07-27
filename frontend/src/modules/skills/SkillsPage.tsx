import { useState } from "react";
import BackupPanel from "./BackupPanel";
import CategoryForm from "./CategoryForm";
import CategoryList from "./CategoryList";
import ConfirmDialog from "./ConfirmDialog";
import CourseForm from "./CourseForm";
import CourseList from "./CourseList";
import SessionForm from "./SessionForm";
import SessionList from "./SessionList";
import type { CourseProgress, LearningSession, SkillCategory } from "./types";
import { useCourseProgress } from "./useCourseProgress";
import { useLearningSessions } from "./useLearningSessions";
import { useSkillCategories } from "./useSkillCategories";

type Tab = "sessions" | "courses" | "categories" | "backup";

export default function SkillsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("sessions");
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [editingSession, setEditingSession] = useState<LearningSession | null>(null);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseProgress | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SkillCategory | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: "session" | "course" | "category";
    id: string;
    name: string;
  } | null>(null);

  const {
    sessions,
    loading: sessionsLoading,
    addSession,
    editSession,
    removeSession,
  } = useLearningSessions();
  const {
    categories,
    loading: categoriesLoading,
    addCategory,
    editCategory,
    removeCategory,
  } = useSkillCategories();
  const {
    courses,
    loading: coursesLoading,
    addCourse,
    editCourse,
    removeCourse,
    updateProgress,
  } = useCourseProgress();

  const loading = sessionsLoading || categoriesLoading || coursesLoading;

  const handleSessionSubmit = (input: {
    duration: number;
    skillCategoryId: string;
    notes?: string;
  }) => {
    if (editingSession) {
      editSession(editingSession.id, input);
      setEditingSession(null);
    } else {
      addSession(input);
    }
    setShowSessionForm(false);
  };

  const handleCourseSubmit = (input: { name: string; platform: string; totalLessons: number }) => {
    if (editingCourse) {
      editCourse(editingCourse.id, input);
      setEditingCourse(null);
    } else {
      addCourse(input);
    }
    setShowCourseForm(false);
  };

  const handleCategorySubmit = (input: { name: string; description?: string }) => {
    if (editingCategory) {
      editCategory(editingCategory.id, input);
      setEditingCategory(null);
    } else {
      addCategory(input);
    }
    setShowCategoryForm(false);
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirmation) return;

    switch (deleteConfirmation.type) {
      case "session":
        removeSession(deleteConfirmation.id);
        break;
      case "course":
        removeCourse(deleteConfirmation.id);
        break;
      case "category":
        removeCategory(deleteConfirmation.id);
        break;
    }
    setDeleteConfirmation(null);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "sessions", label: "Sessions" },
    { id: "courses", label: "Courses" },
    { id: "categories", label: "Categories" },
    { id: "backup", label: "Backup" },
  ];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Skills</h1>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "sessions" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Learning Sessions</h2>
              <button
                type="button"
                onClick={() => {
                  setEditingSession(null);
                  setShowSessionForm(true);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Log Session
              </button>
            </div>

            {showSessionForm && (
              <div className="mb-6">
                <SessionForm
                  session={editingSession ?? undefined}
                  categories={categories}
                  onSubmit={handleSessionSubmit}
                  onCancel={() => {
                    setShowSessionForm(false);
                    setEditingSession(null);
                  }}
                />
              </div>
            )}

            <SessionList
              sessions={sessions}
              categories={categories}
              onEdit={(session) => {
                setEditingSession(session);
                setShowSessionForm(true);
              }}
              onDelete={(id) => {
                const session = sessions.find((s) => s.id === id);
                setDeleteConfirmation({
                  type: "session",
                  id,
                  name: `Session on ${new Date(session?.timestamp ?? "").toLocaleDateString()}`,
                });
              }}
            />
          </div>
        )}

        {activeTab === "courses" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Course Progress</h2>
              <button
                type="button"
                onClick={() => {
                  setEditingCourse(null);
                  setShowCourseForm(true);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Add Course
              </button>
            </div>

            {showCourseForm && (
              <div className="mb-6">
                <CourseForm
                  course={editingCourse ?? undefined}
                  onSubmit={handleCourseSubmit}
                  onCancel={() => {
                    setShowCourseForm(false);
                    setEditingCourse(null);
                  }}
                />
              </div>
            )}

            <CourseList
              courses={courses}
              onEdit={(course) => {
                setEditingCourse(course);
                setShowCourseForm(true);
              }}
              onDelete={(id) => {
                const course = courses.find((c) => c.id === id);
                setDeleteConfirmation({
                  type: "course",
                  id,
                  name: course?.name ?? "Course",
                });
              }}
              onUpdateProgress={updateProgress}
            />
          </div>
        )}

        {activeTab === "categories" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Skill Categories</h2>
              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  setShowCategoryForm(true);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Create Category
              </button>
            </div>

            {showCategoryForm && (
              <div className="mb-6">
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
              categories={categories}
              sessions={sessions}
              onEdit={(category) => {
                setEditingCategory(category);
                setShowCategoryForm(true);
              }}
              onDelete={(id) => {
                const category = categories.find((c) => c.id === id);
                const _sessionCount = sessions.filter((s) => s.skillCategoryId === id).length;
                setDeleteConfirmation({
                  type: "category",
                  id,
                  name: category?.name ?? "Category",
                });
              }}
            />
          </div>
        )}

        {activeTab === "backup" && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Backup & Export</h2>
            <BackupPanel
              onImportComplete={() => {
                // Refresh all data
                window.location.reload();
              }}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
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
