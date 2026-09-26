import type { Account, NewAccountInput } from "../domain/types.js";

export interface AccountRepository {
  getById(id: string, userId: string): Promise<Account | undefined>;
  getAll(userId: string): Promise<Account[]>;
  getActive(userId: string): Promise<Account[]>;
  create(id: string, input: NewAccountInput, userId: string): Promise<Account>;
  update(id: string, patch: Partial<NewAccountInput>, userId: string): Promise<Account | undefined>;
  archive(id: string, userId: string): Promise<boolean>;
  unarchive(id: string, userId: string): Promise<boolean>;
  delete(id: string, userId: string): Promise<boolean>;
}
