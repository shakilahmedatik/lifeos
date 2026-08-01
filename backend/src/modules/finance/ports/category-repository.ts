import type { Category, NewCategoryInput } from "../domain/types.js";

export interface CategoryRepository {
  getById(id: string): Category | undefined;
  getAll(): Category[];
  getActive(): Category[];
  getByKind(kind: Category["kind"]): Category[];
  create(id: string, input: NewCategoryInput): Category;
  update(id: string, patch: Partial<NewCategoryInput>): Category | undefined;
  archive(id: string): boolean;
  unarchive(id: string): boolean;
  delete(id: string): boolean;
}
