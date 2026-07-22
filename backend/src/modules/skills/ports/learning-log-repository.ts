import type { LearningLog, NewLearningLogInput } from "../domain/types.js";

export interface LearningLogRepository {
  getById(id: string): LearningLog | undefined;
  getByResourceId(resourceId: string): LearningLog[];
  getByDateRange(startDate: string, endDate: string): LearningLog[];
  create(id: string, input: NewLearningLogInput): LearningLog;
  delete(id: string): boolean;
}
