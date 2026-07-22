import { randomUUID } from "node:crypto";

import type { LearningResource, NewLearningResourceInput } from "../domain/types.js";
import type { LearningResourceRepository } from "../ports/learning-resource-repository.js";

export class LearningResourceService {
  constructor(private readonly repo: LearningResourceRepository) {}

  create(input: NewLearningResourceInput): LearningResource {
    const id = randomUUID();
    return this.repo.create(id, input);
  }

  list(): LearningResource[] {
    return this.repo.getAll();
  }

  getBySkillArea(skillAreaId: string): LearningResource[] {
    return this.repo.getBySkillArea(skillAreaId);
  }

  getById(id: string): LearningResource | undefined {
    return this.repo.getById(id);
  }

  update(id: string, patch: Partial<NewLearningResourceInput>): LearningResource | undefined {
    return this.repo.update(id, patch);
  }

  delete(id: string): boolean {
    return this.repo.delete(id);
  }
}
