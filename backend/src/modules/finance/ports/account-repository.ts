import type { Account, NewAccountInput } from "../domain/types.js";

export interface AccountRepository {
  getById(id: string): Promise<Account | undefined>;
  getAll(): Promise<Account[]>;
  getActive(): Promise<Account[]>;
  create(id: string, input: NewAccountInput): Promise<Account>;
  update(id: string, patch: Partial<NewAccountInput>): Promise<Account | undefined>;
  archive(id: string): Promise<boolean>;
  unarchive(id: string): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}
