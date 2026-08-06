import type { NewSkillAreaInput, SkillArea } from "../domain/types.js";

export interface SkillAreaRepository {
  getById(id: string): Promise<SkillArea | undefined>;
  getAll(): Promise<SkillArea[]>;
  getByName(name: string): Promise<SkillArea | undefined>;
  create(id: string, input: NewSkillAreaInput): Promise<SkillArea>;
  update(id: string, patch: Partial<NewSkillAreaInput>): Promise<SkillArea | undefined>;
  delete(id: string): Promise<boolean>;
}
