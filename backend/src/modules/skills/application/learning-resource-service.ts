import { randomUUID } from "node:crypto";

import type { LearningResource, NewLearningResourceInput } from "../domain/types.js";
import type { LearningResourceRepository } from "../ports/learning-resource-repository.js";
import type { SkillAreaRepository } from "../ports/skill-area-repository.js";

export class LearningResourceService {
  constructor(
    private readonly repo: LearningResourceRepository,
    private readonly skillAreaRepo: SkillAreaRepository,
  ) {}

  async create(input: NewLearningResourceInput, userId = "default"): Promise<LearningResource> {
    const area = await this.skillAreaRepo.getById(input.skillAreaId, userId);
    if (!area) throw new Error("Skill area not found");
    const id = randomUUID();
    return await this.repo.create(id, input, userId);
  }

  async list(userId = "default"): Promise<LearningResource[]> {
    return await this.repo.getAll(userId);
  }

  async getBySkillArea(skillAreaId: string, userId = "default"): Promise<LearningResource[]> {
    return await this.repo.getBySkillArea(skillAreaId, userId);
  }

  async getById(id: string, userId = "default"): Promise<LearningResource | undefined> {
    return await this.repo.getById(id, userId);
  }

  async update(
    id: string,
    patch: Partial<NewLearningResourceInput>,
    userId = "default",
  ): Promise<LearningResource | undefined> {
    if (patch.skillAreaId) {
      const area = await this.skillAreaRepo.getById(patch.skillAreaId, userId);
      if (!area) throw new Error("Skill area not found");
    }
    return await this.repo.update(id, patch, userId);
  }

  async delete(id: string, userId = "default"): Promise<boolean> {
    return await this.repo.delete(id, userId);
  }
}
