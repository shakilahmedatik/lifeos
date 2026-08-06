import { randomUUID } from "node:crypto";

import type { LearningResource, NewLearningResourceInput } from "../domain/types.js";
import type { LearningResourceRepository } from "../ports/learning-resource-repository.js";
import type { SkillAreaRepository } from "../ports/skill-area-repository.js";

export class LearningResourceService {
  constructor(
    private readonly repo: LearningResourceRepository,
    private readonly skillAreaRepo: SkillAreaRepository,
  ) {}

  async create(input: NewLearningResourceInput): Promise<LearningResource> {
    const area = await this.skillAreaRepo.getById(input.skillAreaId);
    if (!area) throw new Error("Skill area not found");
    const id = randomUUID();
    return await this.repo.create(id, input);
  }

  async list(): Promise<LearningResource[]> {
    return await this.repo.getAll();
  }

  async getBySkillArea(skillAreaId: string): Promise<LearningResource[]> {
    return await this.repo.getBySkillArea(skillAreaId);
  }

  async getById(id: string): Promise<LearningResource | undefined> {
    return await this.repo.getById(id);
  }

  async update(
    id: string,
    patch: Partial<NewLearningResourceInput>,
  ): Promise<LearningResource | undefined> {
    if (patch.skillAreaId) {
      const area = await this.skillAreaRepo.getById(patch.skillAreaId);
      if (!area) throw new Error("Skill area not found");
    }
    return await this.repo.update(id, patch);
  }

  async delete(id: string): Promise<boolean> {
    return await this.repo.delete(id);
  }
}
