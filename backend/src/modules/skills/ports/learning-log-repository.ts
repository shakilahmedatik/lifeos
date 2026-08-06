import type { LearningLog, NewLearningLogInput } from "../domain/types.js";

export interface LearningLogRepository {
  getById(id: string): Promise<LearningLog | undefined>;
  getByResourceId(resourceId: string): Promise<LearningLog[]>;
  getByDateRange(startDate: string, endDate: string): Promise<LearningLog[]>;
  getByResourceIds(resourceIds: string[]): Promise<LearningLog[]>;
  create(id: string, input: NewLearningLogInput): Promise<LearningLog>;
  update(id: string, patch: Partial<NewLearningLogInput>): Promise<LearningLog | undefined>;
  delete(id: string): Promise<boolean>;
}
