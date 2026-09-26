import { randomUUID } from "node:crypto";

import type { NewSkillAreaInput, SkillArea } from "../domain/types.js";
import type { SkillAreaRepository } from "../ports/skill-area-repository.js";

export class SkillAreaService {
  constructor(private readonly repo: SkillAreaRepository) {}

  async create(input: NewSkillAreaInput, userId = "default"): Promise<SkillArea> {
    const existing = await this.repo.getByName(input.name, userId);
    if (existing) throw new Error("Skill area with this name already exists");
    const id = randomUUID();
    return await this.repo.create(id, input, userId);
  }

  async list(userId = "default"): Promise<SkillArea[]> {
    return await this.repo.getAll(userId);
  }

  async getById(id: string, userId = "default"): Promise<SkillArea | undefined> {
    return await this.repo.getById(id, userId);
  }

  async update(
    id: string,
    patch: Partial<NewSkillAreaInput>,
    userId = "default",
  ): Promise<SkillArea | undefined> {
    if (patch.name) {
      const dup = await this.repo.getByName(patch.name, userId);
      if (dup && dup.id !== id) throw new Error("Skill area with this name already exists");
    }
    return await this.repo.update(id, patch, userId);
  }

  async delete(id: string, userId = "default"): Promise<boolean> {
    return await this.repo.delete(id, userId);
  }
}
