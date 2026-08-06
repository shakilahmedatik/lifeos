import { randomUUID } from "node:crypto";

import type { Category, NewCategoryInput } from "../domain/types.js";
import type { CategoryRepository } from "../ports/category-repository.js";
import type { TransactionRepository } from "../ports/transaction-repository.js";

export class CategoryService {
  constructor(
    private readonly categoryRepo: CategoryRepository,
    private readonly transactionRepo?: TransactionRepository,
  ) {}

  async createCategory(input: NewCategoryInput): Promise<Category> {
    const id = randomUUID();
    return await this.categoryRepo.create(id, input);
  }

  async listCategories(): Promise<Category[]> {
    return await this.categoryRepo.getAll();
  }

  async listActiveCategories(): Promise<Category[]> {
    return await this.categoryRepo.getActive();
  }

  async listByKind(kind: Category["kind"]): Promise<Category[]> {
    return await this.categoryRepo.getByKind(kind);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return await this.categoryRepo.getById(id);
  }

  async updateCategory(
    id: string,
    patch: Partial<NewCategoryInput>,
  ): Promise<Category | undefined> {
    return await this.categoryRepo.update(id, patch);
  }

  async archiveCategory(id: string): Promise<boolean> {
    return await this.categoryRepo.archive(id);
  }

  async unarchiveCategory(id: string): Promise<boolean> {
    return await this.categoryRepo.unarchive(id);
  }

  async deleteCategory(id: string): Promise<boolean> {
    if (this.transactionRepo) {
      const txs = await this.transactionRepo.getByCategoryId(id);
      if (txs.length > 0) {
        throw new Error(
          "Cannot delete category with existing transactions. Archive the category instead.",
        );
      }
    }
    return await this.categoryRepo.delete(id);
  }
}
