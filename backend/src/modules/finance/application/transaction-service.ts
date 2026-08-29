import { randomUUID } from "node:crypto";
import { SYSTEM_CATEGORY_TRANSFER_IN_ID, SYSTEM_CATEGORY_TRANSFER_OUT_ID } from "@lifeos/contracts";

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

  async createTransaction(input: NewTransactionInput, userId?: string): Promise<Transaction> {
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
    return await this.transactionRepo.create(id, input, userId);
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

  private async getSystemCategory(
    id: string,
    name: string,
    kind: "income" | "expense",
  ): Promise<string> {
    const existing = await this.categoryRepo.getById(id);
    if (existing) return existing.id;

    const byKind = await this.categoryRepo.getByKind(kind);
    const found = byKind.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (found) return found.id;

    const created = await this.categoryRepo.create(id, { name, kind, isSystem: true });
    return created.id;
  }

  async createTransfer(
    fromAccountId: string,
    toAccountId: string,
    amountMinor: number,
    date: string,
    note?: string,
    userId?: string,
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

    const expenseCatId = await this.getSystemCategory(
      SYSTEM_CATEGORY_TRANSFER_OUT_ID,
      "Transfer Out",
      "expense",
    );
    const incomeCatId = await this.getSystemCategory(
      SYSTEM_CATEGORY_TRANSFER_IN_ID,
      "Transfer In",
      "income",
    );

    const transferPairId = randomUUID();

    const fromTransaction = await this.transactionRepo.create(
      randomUUID(),
      {
        accountId: fromAccountId,
        categoryId: expenseCatId,
        date,
        amountMinor,
        note: note ? `Transfer to ${toAccount.name}: ${note}` : `Transfer to ${toAccount.name}`,
        transferPairId,
      },
      userId,
    );

    const toTransaction = await this.transactionRepo.create(
      randomUUID(),
      {
        accountId: toAccountId,
        categoryId: incomeCatId,
        date,
        amountMinor,
        note: note
          ? `Transfer from ${fromAccount.name}: ${note}`
          : `Transfer from ${fromAccount.name}`,
        transferPairId,
      },
      userId,
    );

    return { from: fromTransaction, to: toTransaction };
  }
}
