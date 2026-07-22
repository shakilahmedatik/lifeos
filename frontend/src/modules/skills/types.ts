export interface LearningSession {
  id: string;
  duration: number; // in minutes
  skillCategoryId: string;
  notes: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewLearningSessionInput {
  duration: number;
  skillCategoryId: string;
  notes?: string;
}

export interface CourseProgress {
  id: string;
  name: string;
  platform: string;
  totalLessons: number;
  completionPercentage: number;
  lastAccessedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewCourseProgressInput {
  name: string;
  platform: string;
  totalLessons: number;
}

export interface SkillCategory {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewSkillCategoryInput {
  name: string;
  description?: string;
}

export interface LearningBackup {
  id: string;
  timestamp: string;
  version: string;
  schema: string;
  data: {
    sessions: LearningSession[];
    courses: CourseProgress[];
    categories: SkillCategory[];
  };
}

export interface LearningStats {
  totalSessions: number;
  totalMinutes: number;
  activeCourses: number;
  categoriesUsed: number;
}
