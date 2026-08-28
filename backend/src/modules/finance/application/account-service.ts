import { randomUUID } from "node:crypto";

import type { Account, NewAccountInput } from "../domain/types.js";
import type { AccountRepository } from "../ports/account-repository.js";
import type { TransactionRepository } from "../ports/transaction-repository.js";

export class AccountService {
  constructor(
    private readonly accountRepo: AccountRepository,
    private readonly transactionRepo: TransactionRepository,
  ) {}

  async createAccount(input: NewAccountInput, userId?: string): Promise<Account> {
    const id = randomUUID();
    return await this.accountRepo.create(id, input, userId);
  }

  async listAccounts(): Promise<Account[]> {
    return await this.accountRepo.getAll();
  }

  async listActiveAccounts(): Promise<Account[]> {
    return await this.accountRepo.getActive();
  }

  async getAccount(id: string): Promise<Account | undefined> {
    return await this.accountRepo.getById(id);
  }

  async updateAccount(id: string, patch: Partial<NewAccountInput>): Promise<Account | undefined> {
    return await this.accountRepo.update(id, patch);
  }

  async archiveAccount(id: string): Promise<boolean> {
    return await this.accountRepo.archive(id);
  }

  async unarchiveAccount(id: string): Promise<boolean> {
    return await this.accountRepo.unarchive(id);
  }

  async deleteAccount(id: string): Promise<boolean> {
    const txs = await this.transactionRepo.getByAccountId(id);
    if (txs.length > 0) {
      throw new Error(
        "Cannot delete account with existing transactions. Archive the account instead.",
      );
    }
    return await this.accountRepo.delete(id);
  }

  async getAccountBalance(id: string): Promise<number> {
    return await this.transactionRepo.getAccountBalance(id);
  }
}
