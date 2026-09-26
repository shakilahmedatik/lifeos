import type { LearningLog, NewLearningLogInput } from "../domain/types.js";

export interface LearningLogRepository {
  getById(id: string, userId: string): Promise<LearningLog | undefined>;
  getByResourceId(resourceId: string, userId: string): Promise<LearningLog[]>;
  getByDateRange(startDate: string, endDate: string, userId: string): Promise<LearningLog[]>;
  getByResourceIds(
    resourceIds: string[],
    startDate: string | undefined,
    endDate: string | undefined,
    userId: string,
  ): Promise<LearningLog[]>;
  create(id: string, input: NewLearningLogInput, userId: string): Promise<LearningLog>;
  update(
    id: string,
    patch: Partial<NewLearningLogInput>,
    userId: string,
  ): Promise<LearningLog | undefined>;
  delete(id: string, userId: string): Promise<boolean>;
}
