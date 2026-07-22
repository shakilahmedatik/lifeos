import type { LearningResource, NewLearningResourceInput } from "../domain/types.js";

export interface LearningResourceRepository {
  getById(id: string): LearningResource | undefined;
  getBySkillArea(skillAreaId: string): LearningResource[];
  getAll(): LearningResource[];
  create(id: string, input: NewLearningResourceInput): LearningResource;
  update(id: string, patch: Partial<NewLearningResourceInput>): LearningResource | undefined;
  delete(id: string): boolean;
}
