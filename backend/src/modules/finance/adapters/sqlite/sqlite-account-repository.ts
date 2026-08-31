import type { Client } from "@libsql/client";

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
    archived: Boolean(row.archived),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteAccountRepository implements AccountRepository {
  constructor(private readonly client: Client) {}

  async getById(id: string): Promise<Account | undefined> {
    const res = await this.client.execute({
      sql: "SELECT * FROM accounts WHERE id = ? AND deleted_at IS NULL",
      args: [id],
    });
    const row = res.rows[0] as unknown as AccountRow | undefined;
    return row ? rowToAccount(row) : undefined;
  }

  async getAll(): Promise<Account[]> {
    const res = await this.client.execute(
      "SELECT * FROM accounts WHERE deleted_at IS NULL ORDER BY created_at DESC",
    );
    const rows = res.rows as unknown as AccountRow[];
    return rows.map(rowToAccount);
  }

  async getActive(): Promise<Account[]> {
    const res = await this.client.execute(
      "SELECT * FROM accounts WHERE archived = 0 AND deleted_at IS NULL ORDER BY name",
    );
    const rows = res.rows as unknown as AccountRow[];
    return rows.map(rowToAccount);
  }

  async create(id: string, input: NewAccountInput, userId = ""): Promise<Account> {
    const now = new Date().toISOString();
    await this.client.execute({
      sql: `INSERT INTO accounts (id, user_id, name, type, archived, created_at, updated_at)
            VALUES (?, ?, ?, ?, 0, ?, ?)`,
      args: [id, userId, input.name, input.type, now, now],
    });

    return (await this.getById(id)) as Account;
  }

  async update(id: string, patch: Partial<NewAccountInput>): Promise<Account | undefined> {
    const existing = await this.getById(id);
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

    await this.client.execute({
      sql: `UPDATE accounts SET ${fields.join(", ")} WHERE id = ? AND deleted_at IS NULL`,
      args: values,
    });

    return await this.getById(id);
  }

  async archive(id: string): Promise<boolean> {
    const res = await this.client.execute({
      sql: "UPDATE accounts SET archived = 1, updated_at = ? WHERE id = ? AND deleted_at IS NULL",
      args: [new Date().toISOString(), id],
    });
    return res.rowsAffected > 0;
  }

  async unarchive(id: string): Promise<boolean> {
    const res = await this.client.execute({
      sql: "UPDATE accounts SET archived = 0, updated_at = ? WHERE id = ? AND deleted_at IS NULL",
      args: [new Date().toISOString(), id],
    });
    return res.rowsAffected > 0;
  }

  async delete(id: string): Promise<boolean> {
    const now = new Date().toISOString();
    const res = await this.client.execute({
      sql: "UPDATE accounts SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL",
      args: [now, now, id],
    });
    return res.rowsAffected > 0;
  }
}
