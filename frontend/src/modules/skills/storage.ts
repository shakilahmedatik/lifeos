import type {
  CourseProgress,
  LearningSession,
  NewCourseProgressInput,
  NewLearningSessionInput,
  NewSkillCategoryInput,
  SkillCategory,
} from "./types";

const STORAGE_KEYS = {
  SESSIONS: "lifeos_learning_sessions",
  COURSES: "lifeos_learning_courses",
  CATEGORIES: "lifeos_skill_categories",
} as const;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getFromStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveToStorage<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Learning Sessions
export function getSessions(): LearningSession[] {
  return getFromStorage<LearningSession>(STORAGE_KEYS.SESSIONS);
}

export function createSession(input: NewLearningSessionInput): LearningSession {
  const sessions = getSessions();
  const newSession: LearningSession = {
    id: generateId(),
    duration: input.duration,
    skillCategoryId: input.skillCategoryId,
    notes: input.notes || "",
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  sessions.unshift(newSession);
  saveToStorage(STORAGE_KEYS.SESSIONS, sessions);
  return newSession;
}

export function updateSession(
  id: string,
  patch: Partial<NewLearningSessionInput>,
): LearningSession | null {
  const sessions = getSessions();
  const index = sessions.findIndex((s) => s.id === id);
  if (index === -1) return null;

  const updatedSession: LearningSession = {
    ...sessions[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  sessions[index] = updatedSession;
  saveToStorage(STORAGE_KEYS.SESSIONS, sessions);
  return updatedSession;
}

export function deleteSession(id: string): boolean {
  const sessions = getSessions();
  const filteredSessions = sessions.filter((s) => s.id !== id);
  if (filteredSessions.length === sessions.length) return false;
  saveToStorage(STORAGE_KEYS.SESSIONS, filteredSessions);
  return true;
}

// Course Progress
export function getCourses(): CourseProgress[] {
  return getFromStorage<CourseProgress>(STORAGE_KEYS.COURSES);
}

export function createCourse(input: NewCourseProgressInput): CourseProgress {
  const courses = getCourses();
  const newCourse: CourseProgress = {
    id: generateId(),
    name: input.name,
    platform: input.platform,
    totalLessons: input.totalLessons,
    completionPercentage: 0,
    lastAccessedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  courses.unshift(newCourse);
  saveToStorage(STORAGE_KEYS.COURSES, courses);
  return newCourse;
}

export function updateCourse(
  id: string,
  patch: Partial<NewCourseProgressInput & { completionPercentage: number }>,
): CourseProgress | null {
  const courses = getCourses();
  const index = courses.findIndex((c) => c.id === id);
  if (index === -1) return null;

  const updatedCourse: CourseProgress = {
    ...courses[index],
    ...patch,
    lastAccessedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  courses[index] = updatedCourse;
  saveToStorage(STORAGE_KEYS.COURSES, courses);
  return updatedCourse;
}

export function deleteCourse(id: string): boolean {
  const courses = getCourses();
  const filteredCourses = courses.filter((c) => c.id !== id);
  if (filteredCourses.length === courses.length) return false;
  saveToStorage(STORAGE_KEYS.COURSES, filteredCourses);
  return true;
}

// Skill Categories
export function getCategories(): SkillCategory[] {
  return getFromStorage<SkillCategory>(STORAGE_KEYS.CATEGORIES);
}

export function createCategory(input: NewSkillCategoryInput): SkillCategory {
  const categories = getCategories();
  const newCategory: SkillCategory = {
    id: generateId(),
    name: input.name,
    description: input.description || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  categories.push(newCategory);
  saveToStorage(STORAGE_KEYS.CATEGORIES, categories);
  return newCategory;
}

export function updateCategory(
  id: string,
  patch: Partial<NewSkillCategoryInput>,
): SkillCategory | null {
  const categories = getCategories();
  const index = categories.findIndex((c) => c.id === id);
  if (index === -1) return null;

  const updatedCategory: SkillCategory = {
    ...categories[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  categories[index] = updatedCategory;
  saveToStorage(STORAGE_KEYS.CATEGORIES, categories);
  return updatedCategory;
}

export function deleteCategory(id: string): boolean {
  const categories = getCategories();
  const filteredCategories = categories.filter((c) => c.id !== id);
  if (filteredCategories.length === categories.length) return false;
  saveToStorage(STORAGE_KEYS.CATEGORIES, filteredCategories);
  return true;
}

// Utility functions
export function getSessionCountByCategory(categoryId: string): number {
  return getSessions().filter((s) => s.skillCategoryId === categoryId).length;
}

export function getLearningStats() {
  const sessions = getSessions();
  const courses = getCourses();
  const categories = getCategories();

  return {
    totalSessions: sessions.length,
    totalMinutes: sessions.reduce((sum, s) => sum + s.duration, 0),
    activeCourses: courses.length,
    categoriesUsed: new Set(sessions.map((s) => s.skillCategoryId)).size,
  };
}
