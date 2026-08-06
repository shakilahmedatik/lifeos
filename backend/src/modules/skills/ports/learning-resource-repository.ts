import type { LearningResource, NewLearningResourceInput } from "../domain/types.js";

export interface LearningResourceRepository {
  getById(id: string): Promise<LearningResource | undefined>;
  getBySkillArea(skillAreaId: string): Promise<LearningResource[]>;
  getAll(): Promise<LearningResource[]>;
  create(id: string, input: NewLearningResourceInput): Promise<LearningResource>;
  update(
    id: string,
    patch: Partial<NewLearningResourceInput>,
  ): Promise<LearningResource | undefined>;
  delete(id: string): Promise<boolean>;
}
