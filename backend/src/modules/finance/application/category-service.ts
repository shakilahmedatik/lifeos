import { randomUUID } from "node:crypto";

import type { Category, NewCategoryInput } from "../domain/types.js";
import type { CategoryRepository } from "../ports/category-repository.js";

export class CategoryService {
  constructor(private readonly categoryRepo: CategoryRepository) {}

  createCategory(input: NewCategoryInput): Category {
    const id = randomUUID();
    return this.categoryRepo.create(id, input);
  }

  listCategories(): Category[] {
    return this.categoryRepo.getAll();
  }

  listActiveCategories(): Category[] {
    return this.categoryRepo.getActive();
  }

  listByKind(kind: Category["kind"]): Category[] {
    return this.categoryRepo.getByKind(kind);
  }

  getCategory(id: string): Category | undefined {
    return this.categoryRepo.getById(id);
  }

  updateCategory(id: string, patch: Partial<NewCategoryInput>): Category | undefined {
    return this.categoryRepo.update(id, patch);
  }

  archiveCategory(id: string): boolean {
    return this.categoryRepo.archive(id);
  }

  unarchiveCategory(id: string): boolean {
    return this.categoryRepo.unarchive(id);
  }

  deleteCategory(id: string): boolean {
    return this.categoryRepo.delete(id);
  }
}
