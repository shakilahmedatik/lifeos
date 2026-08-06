import { randomUUID } from "node:crypto";

import type { NewTransactionInput, Transaction } from "../domain/types.js";
import type { AccountRepository } from "../ports/account-repository.js";
import type { CategoryRepository } from "../ports/category-repository.js";
import type { TransactionRepository } from "../ports/transaction-repository.js";

export class TransactionService {
  constructor(
    private readonly transactionRepo: TransactionRepository,
    private readonly accountRepo: AccountRepository,
    private readonly categoryRepo: CategoryRepository,
  ) {}

  async createTransaction(input: NewTransactionInput): Promise<Transaction> {
    const account = await this.accountRepo.getById(input.accountId);
    if (!account) {
      throw new Error("Account not found");
    }
    if (account.archived) {
      throw new Error("Cannot create transaction for archived account");
    }

    const category = await this.categoryRepo.getById(input.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }
    if (category.archived) {
      throw new Error("Cannot create transaction for archived category");
    }

    if (input.amountMinor <= 0) {
      throw new Error("Amount must be positive");
    }

    const id = randomUUID();
    return await this.transactionRepo.create(id, input);
  }

  async listTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    return await this.transactionRepo.getByDateRange(startDate, endDate);
  }

  async listTransactionsByAccount(accountId: string): Promise<Transaction[]> {
    return await this.transactionRepo.getByAccountId(accountId);
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return await this.transactionRepo.getById(id);
  }

  async updateTransaction(
    id: string,
    patch: Partial<NewTransactionInput>,
  ): Promise<Transaction | undefined> {
    if (patch.accountId !== undefined) {
      const account = await this.accountRepo.getById(patch.accountId);
      if (!account) {
        throw new Error("Account not found");
      }
      if (account.archived) {
        throw new Error("Cannot move transaction to archived account");
      }
    }

    if (patch.categoryId !== undefined) {
      const category = await this.categoryRepo.getById(patch.categoryId);
      if (!category) {
        throw new Error("Category not found");
      }
      if (category.archived) {
        throw new Error("Cannot move transaction to archived category");
      }
    }

    if (patch.amountMinor !== undefined && patch.amountMinor <= 0) {
      throw new Error("Amount must be positive");
    }

    return await this.transactionRepo.update(id, patch);
  }

  async listTransactionsByAccountAndDateRange(
    accountId: string,
    startDate: string,
    endDate: string,
  ): Promise<Transaction[]> {
    return await this.transactionRepo.getByAccountAndDateRange(accountId, startDate, endDate);
  }

  async deleteTransaction(id: string): Promise<boolean> {
    return await this.transactionRepo.delete(id);
  }

  private async ensureCategoryExists(
    id: string,
    name: string,
    kind: "income" | "expense",
  ): Promise<string> {
    const existing = await this.categoryRepo.getById(id);
    if (existing) return existing.id;

    const activeKindCats = await this.categoryRepo.getByKind(kind);
    if (activeKindCats.length > 0) {
      return activeKindCats[0].id;
    }

    const created = await this.categoryRepo.create(id, { name, kind });
    return created.id;
  }

  async createTransfer(
    fromAccountId: string,
    toAccountId: string,
    amountMinor: number,
    date: string,
    note?: string,
  ): Promise<{ from: Transaction; to: Transaction }> {
    const fromAccount = await this.accountRepo.getById(fromAccountId);
    if (!fromAccount) {
      throw new Error("Source account not found");
    }
    const toAccount = await this.accountRepo.getById(toAccountId);
    if (!toAccount) {
      throw new Error("Destination account not found");
    }

    if (fromAccountId === toAccountId) {
      throw new Error("Cannot transfer to the same account");
    }

    if (amountMinor <= 0) {
      throw new Error("Amount must be positive");
    }

    const expenseCatId = await this.ensureCategoryExists(
      "cat-expense-other",
      "Transfer Out",
      "expense",
    );
    const incomeCatId = await this.ensureCategoryExists(
      "cat-income-other",
      "Transfer In",
      "income",
    );

    const transferPairId = randomUUID();

    const fromTransaction = await this.transactionRepo.create(randomUUID(), {
      accountId: fromAccountId,
      categoryId: expenseCatId,
      date,
      amountMinor,
      note: note ? `Transfer to ${toAccount.name}: ${note}` : `Transfer to ${toAccount.name}`,
      transferPairId,
    });

    const toTransaction = await this.transactionRepo.create(randomUUID(), {
      accountId: toAccountId,
      categoryId: incomeCatId,
      date,
      amountMinor,
      note: note
        ? `Transfer from ${fromAccount.name}: ${note}`
        : `Transfer from ${fromAccount.name}`,
      transferPairId,
    });

    return { from: fromTransaction, to: toTransaction };
  }
}
