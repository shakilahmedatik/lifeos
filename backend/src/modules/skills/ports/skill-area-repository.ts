import type { NewSkillAreaInput, SkillArea } from "../domain/types.js";

export interface SkillAreaRepository {
  getById(id: string): SkillArea | undefined;
  getAll(): SkillArea[];
  getByName(name: string): SkillArea | undefined;
  create(id: string, input: NewSkillAreaInput): SkillArea;
  update(id: string, patch: Partial<NewSkillAreaInput>): SkillArea | undefined;
  delete(id: string): boolean;
}
