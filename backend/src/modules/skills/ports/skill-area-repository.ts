import type { NewSkillAreaInput, SkillArea } from "../domain/types.js";

export interface SkillAreaRepository {
  getById(id: string, userId: string): Promise<SkillArea | undefined>;
  getAll(userId: string): Promise<SkillArea[]>;
  getByName(name: string, userId: string): Promise<SkillArea | undefined>;
  create(id: string, input: NewSkillAreaInput, userId: string): Promise<SkillArea>;
  update(
    id: string,
    patch: Partial<NewSkillAreaInput>,
    userId: string,
  ): Promise<SkillArea | undefined>;
  delete(id: string, userId: string): Promise<boolean>;
}
