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

  createTransaction(input: NewTransactionInput): Transaction {
    const account = this.accountRepo.getById(input.accountId);
    if (!account) {
      throw new Error("Account not found");
    }
    if (account.archived) {
      throw new Error("Cannot create transaction for archived account");
    }

    const category = this.categoryRepo.getById(input.categoryId);
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
    return this.transactionRepo.create(id, input);
  }

  listTransactionsByDateRange(startDate: string, endDate: string): Transaction[] {
    return this.transactionRepo.getByDateRange(startDate, endDate);
  }

  listTransactionsByAccount(accountId: string): Transaction[] {
    return this.transactionRepo.getByAccountId(accountId);
  }

  getTransaction(id: string): Transaction | undefined {
    return this.transactionRepo.getById(id);
  }

  updateTransaction(id: string, patch: Partial<NewTransactionInput>): Transaction | undefined {
    if (patch.accountId !== undefined) {
      const account = this.accountRepo.getById(patch.accountId);
      if (!account) {
        throw new Error("Account not found");
      }
      if (account.archived) {
        throw new Error("Cannot move transaction to archived account");
      }
    }

    if (patch.categoryId !== undefined) {
      const category = this.categoryRepo.getById(patch.categoryId);
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

    return this.transactionRepo.update(id, patch);
  }

  deleteTransaction(id: string): boolean {
    return this.transactionRepo.delete(id);
  }

  createTransfer(
    fromAccountId: string,
    toAccountId: string,
    amountMinor: number,
    date: string,
    note?: string,
  ): { from: Transaction; to: Transaction } {
    const fromAccount = this.accountRepo.getById(fromAccountId);
    if (!fromAccount) {
      throw new Error("Source account not found");
    }
    const toAccount = this.accountRepo.getById(toAccountId);
    if (!toAccount) {
      throw new Error("Destination account not found");
    }

    if (fromAccountId === toAccountId) {
      throw new Error("Cannot transfer to the same account");
    }

    const transferPairId = randomUUID();

    const fromTransaction = this.transactionRepo.create(randomUUID(), {
      accountId: fromAccountId,
      categoryId: "cat-expense-other",
      date,
      amountMinor,
      note: note ? `Transfer to ${toAccount.name}: ${note}` : `Transfer to ${toAccount.name}`,
      transferPairId,
    });

    const toTransaction = this.transactionRepo.create(randomUUID(), {
      accountId: toAccountId,
      categoryId: "cat-income-other",
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
