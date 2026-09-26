import type { LearningResource, NewLearningResourceInput } from "../domain/types.js";

export interface LearningResourceRepository {
  getById(id: string, userId: string): Promise<LearningResource | undefined>;
  getBySkillArea(skillAreaId: string, userId: string): Promise<LearningResource[]>;
  getAll(userId: string): Promise<LearningResource[]>;
  create(id: string, input: NewLearningResourceInput, userId: string): Promise<LearningResource>;
  update(
    id: string,
    patch: Partial<NewLearningResourceInput>,
    userId: string,
  ): Promise<LearningResource | undefined>;
  delete(id: string, userId: string): Promise<boolean>;
}
