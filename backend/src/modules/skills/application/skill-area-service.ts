import { randomUUID } from "node:crypto";

import type { NewSkillAreaInput, SkillArea } from "../domain/types.js";
import type { SkillAreaRepository } from "../ports/skill-area-repository.js";

export class SkillAreaService {
  constructor(private readonly repo: SkillAreaRepository) {}

  create(input: NewSkillAreaInput): SkillArea {
    const existing = this.repo.getByName(input.name);
    if (existing) throw new Error("Skill area with this name already exists");
    const id = randomUUID();
    return this.repo.create(id, input);
  }

  list(): SkillArea[] {
    return this.repo.getAll();
  }

  getById(id: string): SkillArea | undefined {
    return this.repo.getById(id);
  }

  update(id: string, patch: Partial<NewSkillAreaInput>): SkillArea | undefined {
    if (patch.name) {
      const dup = this.repo.getByName(patch.name);
      if (dup && dup.id !== id) throw new Error("Skill area with this name already exists");
    }
    return this.repo.update(id, patch);
  }

  delete(id: string): boolean {
    return this.repo.delete(id);
  }
}
