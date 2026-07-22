import type { Account, NewAccountInput } from "../domain/types.js";

export interface AccountRepository {
  getById(id: string): Account | undefined;
  getAll(): Account[];
  getActive(): Account[];
  create(id: string, input: NewAccountInput): Account;
  update(id: string, patch: Partial<NewAccountInput>): Account | undefined;
  archive(id: string): boolean;
}
