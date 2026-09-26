import { randomUUID } from "node:crypto";
import { RESERVED_CATEGORY_NAMES } from "@lifeos/contracts";

import type { Category, NewCategoryInput } from "../domain/types.js";
import type { CategoryRepository } from "../ports/category-repository.js";
import type { TransactionRepository } from "../ports/transaction-repository.js";

function isReservedName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return RESERVED_CATEGORY_NAMES.some((n) => n.toLowerCase() === normalized);
}

export class CategoryService {
  constructor(
    private readonly categoryRepo: CategoryRepository,
    private readonly transactionRepo?: TransactionRepository,
  ) {}

  async createCategory(input: NewCategoryInput, userId: string): Promise<Category> {
    if (!input.isSystem && isReservedName(input.name)) {
      throw new Error("Transfer In and Transfer Out are reserved system categories");
    }
    const id = randomUUID();
    return await this.categoryRepo.create(id, input, userId);
  }

  async listCategories(userId: string): Promise<Category[]> {
    return await this.categoryRepo.getAll(userId);
  }

  async listActiveCategories(userId: string): Promise<Category[]> {
    return await this.categoryRepo.getActive(userId);
  }

  async listByKind(kind: Category["kind"], userId: string): Promise<Category[]> {
    return await this.categoryRepo.getByKind(kind, userId);
  }

  async getCategory(id: string, userId: string): Promise<Category | undefined> {
    return await this.categoryRepo.getById(id, userId);
  }

  async updateCategory(
    id: string,
    patch: Partial<NewCategoryInput>,
    userId: string,
  ): Promise<Category | undefined> {
    const existing = await this.categoryRepo.getById(id, userId);
    if (!existing) return undefined;
    if (existing.isSystem) {
      throw new Error("Cannot modify system category");
    }
    if (patch.name && isReservedName(patch.name)) {
      throw new Error("Cannot rename to reserved system category name");
    }
    return await this.categoryRepo.update(id, patch, userId);
  }

  async archiveCategory(id: string, userId: string): Promise<boolean> {
    const existing = await this.categoryRepo.getById(id, userId);
    if (!existing) return false;
    if (existing.isSystem) {
      throw new Error("Cannot archive system category");
    }
    return await this.categoryRepo.archive(id, userId);
  }

  async unarchiveCategory(id: string, userId: string): Promise<boolean> {
    const existing = await this.categoryRepo.getById(id, userId);
    if (!existing) return false;
    if (existing.isSystem) {
      throw new Error("Cannot modify system category");
    }
    return await this.categoryRepo.unarchive(id, userId);
  }

  async deleteCategory(id: string, userId: string): Promise<boolean> {
    const existing = await this.categoryRepo.getById(id, userId);
    if (!existing) return false;
    if (existing.isSystem) {
      throw new Error("Cannot delete system category");
    }
    if (this.transactionRepo) {
      const txs = await this.transactionRepo.getByCategoryId(id, userId);
      if (txs.length > 0) {
        throw new Error(
          "Cannot delete category with existing transactions. Archive the category instead.",
        );
      }
    }
    return await this.categoryRepo.delete(id, userId);
  }
}
