export interface SkillArea {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewSkillAreaInput {
  name: string;
}

export type LearningResourceType = "course" | "book" | "project" | "article";
export type LearningUnit = "chapters" | "videos" | "hours";

export interface LearningResource {
  id: string;
  skillAreaId: string;
  title: string;
  type: LearningResourceType;
  totalUnits?: number;
  unit?: LearningUnit;
  createdAt: string;
  updatedAt: string;
}

export interface NewLearningResourceInput {
  skillAreaId: string;
  title: string;
  type: LearningResourceType;
  totalUnits?: number;
  unit?: LearningUnit;
}

export interface LearningLog {
  id: string;
  resourceId: string;
  date: string;
  minutesSpent: number;
  unitsCompleted?: number;
  notes?: string;
  createdAt: string;
}

export interface NewLearningLogInput {
  resourceId: string;
  date: string;
  minutesSpent: number;
  unitsCompleted?: number;
  notes?: string;
}

export interface ResourceWithProgress extends LearningResource {
  totalMinutesSpent: number;
  totalUnitsCompleted: number;
  completionPercent: number;
  skillAreaName: string;
}

export interface SkillAreaSummary {
  skillArea: SkillArea;
  totalResources: number;
  totalMinutesSpent: number;
  totalSessions: number;
}
