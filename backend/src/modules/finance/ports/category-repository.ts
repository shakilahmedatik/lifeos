import type { Category, NewCategoryInput } from "../domain/types.js";

export interface CategoryRepository {
  getById(id: string, userId: string): Promise<Category | undefined>;
  getAll(userId: string): Promise<Category[]>;
  getActive(userId: string): Promise<Category[]>;
  getByKind(kind: Category["kind"], userId: string): Promise<Category[]>;
  create(id: string, input: NewCategoryInput, userId: string): Promise<Category>;
  update(
    id: string,
    patch: Partial<NewCategoryInput>,
    userId: string,
  ): Promise<Category | undefined>;
  archive(id: string, userId: string): Promise<boolean>;
  unarchive(id: string, userId: string): Promise<boolean>;
  delete(id: string, userId: string): Promise<boolean>;
}
