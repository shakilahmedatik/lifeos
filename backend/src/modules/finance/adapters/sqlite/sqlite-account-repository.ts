import type Database from "better-sqlite3";

import type { Account, NewAccountInput } from "../../domain/types.js";
import type { AccountRepository } from "../../ports/account-repository.js";

interface AccountRow {
  id: string;
  name: string;
  type: Account["type"];
  archived: number;
  created_at: string;
  updated_at: string;
}

function rowToAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    archived: row.archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteAccountRepository implements AccountRepository {
  constructor(private readonly db: Database.Database) {}

  getById(id: string): Account | undefined {
    const row = this.db.prepare("SELECT * FROM accounts WHERE id = ?").get(id) as
      | AccountRow
      | undefined;
    return row ? rowToAccount(row) : undefined;
  }

  getAll(): Account[] {
    const rows = this.db
      .prepare("SELECT * FROM accounts ORDER BY created_at DESC")
      .all() as AccountRow[];
    return rows.map(rowToAccount);
  }

  getActive(): Account[] {
    const rows = this.db
      .prepare("SELECT * FROM accounts WHERE archived = 0 ORDER BY name")
      .all() as AccountRow[];
    return rows.map(rowToAccount);
  }

  create(id: string, input: NewAccountInput): Account {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO accounts (id, name, type, archived, created_at, updated_at)
         VALUES (?, ?, ?, 0, ?, ?)`,
      )
      .run(id, input.name, input.type, now, now);

    return this.getById(id) as Account;
  }

  update(id: string, patch: Partial<NewAccountInput>): Account | undefined {
    const existing = this.getById(id);
    if (!existing) return undefined;

    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (patch.name !== undefined) {
      fields.push("name = ?");
      values.push(patch.name);
    }
    if (patch.type !== undefined) {
      fields.push("type = ?");
      values.push(patch.type);
    }

    if (fields.length === 0) return existing;

    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    this.db.prepare(`UPDATE accounts SET ${fields.join(", ")} WHERE id = ?`).run(...values);

    return this.getById(id);
  }

  archive(id: string): boolean {
    const result = this.db
      .prepare("UPDATE accounts SET archived = 1, updated_at = ? WHERE id = ?")
      .run(new Date().toISOString(), id);
    return result.changes > 0;
  }
}
