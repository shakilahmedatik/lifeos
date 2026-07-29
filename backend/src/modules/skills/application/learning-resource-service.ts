import { randomUUID } from "node:crypto";

import type { LearningResource, NewLearningResourceInput } from "../domain/types.js";
import type { LearningResourceRepository } from "../ports/learning-resource-repository.js";
import type { SkillAreaRepository } from "../ports/skill-area-repository.js";

export class LearningResourceService {
  constructor(
    private readonly repo: LearningResourceRepository,
    private readonly skillAreaRepo: SkillAreaRepository,
  ) {}

  create(input: NewLearningResourceInput): LearningResource {
    const area = this.skillAreaRepo.getById(input.skillAreaId);
    if (!area) throw new Error("Skill area not found");
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
    if (patch.skillAreaId) {
      const area = this.skillAreaRepo.getById(patch.skillAreaId);
      if (!area) throw new Error("Skill area not found");
    }
    return this.repo.update(id, patch);
  }

  delete(id: string): boolean {
    return this.repo.delete(id);
  }
}
