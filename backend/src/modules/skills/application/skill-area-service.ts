import { randomUUID } from "node:crypto";

import type { NewSkillAreaInput, SkillArea } from "../domain/types.js";
import type { SkillAreaRepository } from "../ports/skill-area-repository.js";

export class SkillAreaService {
  constructor(private readonly repo: SkillAreaRepository) {}

  async create(input: NewSkillAreaInput): Promise<SkillArea> {
    const existing = await this.repo.getByName(input.name);
    if (existing) throw new Error("Skill area with this name already exists");
    const id = randomUUID();
    return await this.repo.create(id, input);
  }

  async list(): Promise<SkillArea[]> {
    return await this.repo.getAll();
  }

  async getById(id: string): Promise<SkillArea | undefined> {
    return await this.repo.getById(id);
  }

  async update(id: string, patch: Partial<NewSkillAreaInput>): Promise<SkillArea | undefined> {
    if (patch.name) {
      const dup = await this.repo.getByName(patch.name);
      if (dup && dup.id !== id) throw new Error("Skill area with this name already exists");
    }
    return await this.repo.update(id, patch);
  }

  async delete(id: string): Promise<boolean> {
    return await this.repo.delete(id);
  }
}
