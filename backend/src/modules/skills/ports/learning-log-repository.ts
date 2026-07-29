import type { LearningLog, NewLearningLogInput } from "../domain/types.js";

export interface LearningLogRepository {
  getById(id: string): LearningLog | undefined;
  getByResourceId(resourceId: string): LearningLog[];
  getByDateRange(startDate: string, endDate: string): LearningLog[];
  getByResourceIds(resourceIds: string[]): LearningLog[];
  create(id: string, input: NewLearningLogInput): LearningLog;
  update(id: string, patch: Partial<NewLearningLogInput>): LearningLog | undefined;
  delete(id: string): boolean;
}
