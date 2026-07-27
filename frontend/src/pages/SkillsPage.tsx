import { useState } from "react";
import { useAppToast } from "../components/Toast.js";
import Badge from "../components/ui/Badge.js";
import Button from "../components/ui/Button.js";
import Card, { CardHeader, CardTitle } from "../components/ui/Card.js";
import Modal from "../components/ui/Modal.js";
import { GraduationCapIcon, PlusIcon } from "../components/ui/icons.js";
import {
  useCourseProgress,
  useLearningSessions,
  useSkillCategories,
} from "../modules/skills/index.js";
import type {
  NewCourseProgressInput,
  NewLearningSessionInput,
  NewSkillCategoryInput,
} from "../modules/skills/types.js";

type Tab = "sessions" | "courses" | "categories";

export default function SkillsPage() {
  const [tab, setTab] = useState<Tab>("sessions");
  const { sessions, addSession, removeSession } = useLearningSessions();
  const { categories, addCategory, removeCategory } = useSkillCategories();
  const { courses, addCourse, removeCourse } = useCourseProgress();

  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(30);
  const [sessionCategory, setSessionCategory] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");

  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [coursePlatform, setCoursePlatform] = useState("");
  const [courseLessons, setCourseLessons] = useState(0);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDesc, setCategoryDesc] = useState("");
  const toast = useAppToast();

  const tabs: Tab[] = ["sessions", "courses", "categories"];

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionCategory) return;
    const input: NewLearningSessionInput = {
      duration: sessionDuration,
      skillCategoryId: sessionCategory,
      notes: sessionNotes.trim() || undefined,
    };
    try {
      addSession(input);
      toast.success("Session logged");
    } catch {
      toast.error("Failed to log session");
    }
    setSessionDuration(30);
    setSessionNotes("");
    setShowSessionForm(false);
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim()) return;
    const input: NewCourseProgressInput = {
      name: courseName.trim(),
      platform: coursePlatform.trim(),
      totalLessons: courseLessons,
    };
    try {
      addCourse(input);
      toast.success("Course added");
    } catch {
      toast.error("Failed to add course");
    }
    setCourseName("");
    setCoursePlatform("");
    setCourseLessons(0);
    setShowCourseForm(false);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    const input: NewSkillCategoryInput = {
      name: categoryName.trim(),
      description: categoryDesc.trim() || undefined,
    };
    try {
      addCategory(input);
      toast.success("Category added");
    } catch {
      toast.error("Failed to add category");
    }
    setCategoryName("");
    setCategoryDesc("");
    setShowCategoryForm(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Skills</h1>
          <p className="text-sm text-gray-500 mt-1">Track your learning journey</p>
        </div>
        <div className="flex items-center gap-2">
          {tab === "sessions" && (
            <Button
              size="sm"
              icon={<PlusIcon size={14} />}
              onClick={() => setShowSessionForm(true)}
            >
              Log Session
            </Button>
          )}
          {tab === "courses" && (
            <Button size="sm" icon={<PlusIcon size={14} />} onClick={() => setShowCourseForm(true)}>
              Add Course
            </Button>
          )}
          {tab === "categories" && (
            <Button
              size="sm"
              icon={<PlusIcon size={14} />}
              onClick={() => setShowCategoryForm(true)}
            >
              Add Category
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-gray-800/60 rounded-xl w-fit">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              tab === t
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "sessions" && (
        <div className="space-y-2">
          {sessions.length === 0 ? (
            <Card className="text-center py-8">
              <GraduationCapIcon size={32} className="text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No learning sessions logged yet</p>
            </Card>
          ) : (
            sessions.map((s) => (
              <Card key={s.id} padding="sm" className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-200">{s.duration} min</span>
                    {categories.find((c) => c.id === s.skillCategoryId) && (
                      <Badge variant="default" size="sm">
                        {categories.find((c) => c.id === s.skillCategoryId)?.name}
                      </Badge>
                    )}
                  </div>
                  {s.notes && <p className="text-xs text-gray-500 mt-0.5">{s.notes}</p>}
                  <p className="text-xs text-gray-600 mt-0.5">
                    {new Date(s.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => removeSession(s.id)}
                  className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-900/30 transition-colors"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === "courses" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {courses.length === 0 ? (
            <Card className="text-center py-8 col-span-full">
              <GraduationCapIcon size={32} className="text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No courses yet</p>
            </Card>
          ) : (
            courses.map((c) => (
              <Card key={c.id} hover>
                <CardHeader>
                  <CardTitle>{c.name}</CardTitle>
                  <button
                    onClick={() => removeCourse(c.id)}
                    className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-900/30 transition-colors"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </CardHeader>
                <p className="text-xs text-gray-500 mb-2">{c.platform}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all"
                      style={{ width: `${c.completionPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-400">
                    {c.completionPercentage}%
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === "categories" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.length === 0 ? (
            <Card className="text-center py-8 col-span-full">
              <GraduationCapIcon size={32} className="text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No categories yet</p>
            </Card>
          ) : (
            categories.map((c) => (
              <Card key={c.id} hover className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-200">{c.name}</p>
                  {c.description && <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>}
                </div>
                <button
                  onClick={() => removeCategory(c.id)}
                  className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-900/30 transition-colors"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </Card>
            ))
          )}
        </div>
      )}

      <Modal
        open={showSessionForm}
        onClose={() => setShowSessionForm(false)}
        title="Log Learning Session"
      >
        <form onSubmit={handleAddSession} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Duration (minutes)</label>
            <input
              type="number"
              value={sessionDuration}
              onChange={(e) => setSessionDuration(Number(e.target.value))}
              min={1}
              className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Category</label>
            <select
              value={sessionCategory}
              onChange={(e) => setSessionCategory(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
              required
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Notes</label>
            <textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              rows={2}
              className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowSessionForm(false)}>
              Cancel
            </Button>
            <Button type="submit">Log Session</Button>
          </div>
        </form>
      </Modal>

      <Modal open={showCourseForm} onClose={() => setShowCourseForm(false)} title="Add Course">
        <form onSubmit={handleAddCourse} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Course Name</label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Platform</label>
            <input
              type="text"
              value={coursePlatform}
              onChange={(e) => setCoursePlatform(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Total Lessons</label>
            <input
              type="number"
              value={courseLessons}
              onChange={(e) => setCourseLessons(Number(e.target.value))}
              min={0}
              className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowCourseForm(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Course</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showCategoryForm}
        onClose={() => setShowCategoryForm(false)}
        title="Add Category"
      >
        <form onSubmit={handleAddCategory} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              value={categoryDesc}
              onChange={(e) => setCategoryDesc(e.target.value)}
              rows={2}
              className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowCategoryForm(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Category</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
