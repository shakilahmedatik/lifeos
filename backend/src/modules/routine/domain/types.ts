export type TaskCategory = "work" | "workout" | "learning" | "habit" | "personal" | "general";

export type TaskStatus = "planned" | "in_progress" | "done" | "skipped";

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  date: string;
  startTime: string;
  endTime: string;
  status: TaskStatus;
  notes?: string;
  reminderMinutesBefore?: number;
  reminderSound: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewTaskInput {
  title: string;
  category?: TaskCategory;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
  reminderMinutesBefore?: number;
  reminderSound?: boolean;
}
