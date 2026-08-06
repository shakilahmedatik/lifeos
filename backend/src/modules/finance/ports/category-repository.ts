import type { Category, NewCategoryInput } from "../domain/types.js";

export interface CategoryRepository {
  getById(id: string): Promise<Category | undefined>;
  getAll(): Promise<Category[]>;
  getActive(): Promise<Category[]>;
  getByKind(kind: Category["kind"]): Promise<Category[]>;
  create(id: string, input: NewCategoryInput): Promise<Category>;
  update(id: string, patch: Partial<NewCategoryInput>): Promise<Category | undefined>;
  archive(id: string): Promise<boolean>;
  unarchive(id: string): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}
