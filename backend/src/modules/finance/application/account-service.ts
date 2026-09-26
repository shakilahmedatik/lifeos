import { randomUUID } from "node:crypto";
import {
  SYSTEM_CATEGORY_OPENING_BALANCE_EXPENSE_ID,
  SYSTEM_CATEGORY_OPENING_BALANCE_ID,
} from "@lifeos/contracts";

import type { Account, NewAccountInput } from "../domain/types.js";
import type { AccountRepository } from "../ports/account-repository.js";
import type { TransactionRepository } from "../ports/transaction-repository.js";

export class AccountService {
  constructor(
    private readonly accountRepo: AccountRepository,
    private readonly transactionRepo: TransactionRepository,
  ) {}

  async createAccount(input: NewAccountInput, userId: string): Promise<Account> {
    const id = randomUUID();
    const account = await this.accountRepo.create(id, input, userId);

    if (input.initialBalanceMinor && input.initialBalanceMinor !== 0) {
      const isPositive = input.initialBalanceMinor > 0;
      const categoryId = isPositive
        ? SYSTEM_CATEGORY_OPENING_BALANCE_ID
        : SYSTEM_CATEGORY_OPENING_BALANCE_EXPENSE_ID;

      await this.transactionRepo.create(
        randomUUID(),
        {
          accountId: account.id,
          categoryId,
          date: new Date().toISOString().split("T")[0],
          amountMinor: Math.abs(input.initialBalanceMinor),
          note: "Opening balance",
        },
        userId,
      );
    }

    return account;
  }

  async listAccounts(userId: string): Promise<Account[]> {
    return await this.accountRepo.getAll(userId);
  }

  async listActiveAccounts(userId: string): Promise<Account[]> {
    return await this.accountRepo.getActive(userId);
  }

  async getAccount(id: string, userId: string): Promise<Account | undefined> {
    return await this.accountRepo.getById(id, userId);
  }

  async updateAccount(
    id: string,
    patch: Partial<NewAccountInput>,
    userId: string,
  ): Promise<Account | undefined> {
    return await this.accountRepo.update(id, patch, userId);
  }

  async archiveAccount(id: string, userId: string): Promise<boolean> {
    return await this.accountRepo.archive(id, userId);
  }

  async unarchiveAccount(id: string, userId: string): Promise<boolean> {
    return await this.accountRepo.unarchive(id, userId);
  }

  async deleteAccount(id: string, userId: string): Promise<boolean> {
    const txs = await this.transactionRepo.getByAccountId(id, userId);
    const nonOpeningTxs = txs.filter(
      (t) =>
        t.categoryId !== SYSTEM_CATEGORY_OPENING_BALANCE_ID &&
        t.categoryId !== SYSTEM_CATEGORY_OPENING_BALANCE_EXPENSE_ID,
    );
    if (nonOpeningTxs.length > 0) {
      throw new Error(
        "Cannot delete account with existing transactions. Archive the account instead.",
      );
    }
    for (const t of txs) {
      await this.transactionRepo.delete(t.id, userId);
    }
    return await this.accountRepo.delete(id, userId);
  }

  async getAccountBalance(id: string, userId: string): Promise<number> {
    return await this.transactionRepo.getAccountBalance(id, userId);
  }
}
