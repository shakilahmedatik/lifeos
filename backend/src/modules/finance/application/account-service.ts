import { randomUUID } from "node:crypto";

import type { Account, NewAccountInput } from "../domain/types.js";
import type { AccountRepository } from "../ports/account-repository.js";
import type { TransactionRepository } from "../ports/transaction-repository.js";

export class AccountService {
  constructor(
    private readonly accountRepo: AccountRepository,
    private readonly transactionRepo: TransactionRepository,
  ) {}

  createAccount(input: NewAccountInput): Account {
    const id = randomUUID();
    return this.accountRepo.create(id, input);
  }

  listAccounts(): Account[] {
    return this.accountRepo.getAll();
  }

  listActiveAccounts(): Account[] {
    return this.accountRepo.getActive();
  }

  getAccount(id: string): Account | undefined {
    return this.accountRepo.getById(id);
  }

  updateAccount(id: string, patch: Partial<NewAccountInput>): Account | undefined {
    return this.accountRepo.update(id, patch);
  }

  archiveAccount(id: string): boolean {
    return this.accountRepo.archive(id);
  }

  getAccountBalance(id: string): number {
    return this.transactionRepo.getAccountBalance(id);
  }
}
