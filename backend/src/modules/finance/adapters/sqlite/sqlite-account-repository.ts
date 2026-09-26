import { and, asc, desc, eq, isNull } from "drizzle-orm";

import type { DrizzleClient } from "../../../../shared/db.js";
import { financeAccounts } from "../../../../shared/schema.js";
import type { Account, NewAccountInput } from "../../domain/types.js";
import type { AccountRepository } from "../../ports/account-repository.js";

function rowToAccount(row: typeof financeAccounts.$inferSelect): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type as Account["type"],
    archived: Boolean(row.archived),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function userScope(userId: string) {
  return and(
    userId ? eq(financeAccounts.userId, userId) : eq(financeAccounts.userId, ""),
    isNull(financeAccounts.deletedAt),
  );
}

export class DrizzleAccountRepository implements AccountRepository {
  constructor(private readonly db: DrizzleClient) {}

  async getById(id: string, userId: string): Promise<Account | undefined> {
    const [row] = await this.db
      .select()
      .from(financeAccounts)
      .where(and(eq(financeAccounts.id, id), userScope(userId)));
    return row ? rowToAccount(row) : undefined;
  }

  async getAll(userId: string): Promise<Account[]> {
    const rows = await this.db
      .select()
      .from(financeAccounts)
      .where(userScope(userId))
      .orderBy(desc(financeAccounts.createdAt));
    return rows.map(rowToAccount);
  }

  async getActive(userId: string): Promise<Account[]> {
    const rows = await this.db
      .select()
      .from(financeAccounts)
      .where(and(eq(financeAccounts.archived, 0), userScope(userId)))
      .orderBy(asc(financeAccounts.name));
    return rows.map(rowToAccount);
  }

  async create(id: string, input: NewAccountInput, userId: string): Promise<Account> {
    const now = new Date().toISOString();
    await this.db.insert(financeAccounts).values({
      id,
      userId,
      name: input.name,
      type: input.type,
      archived: 0,
      createdAt: now,
      updatedAt: now,
    });

    return (await this.getById(id, userId)) as Account;
  }

  async update(
    id: string,
    patch: Partial<NewAccountInput>,
    userId: string,
  ): Promise<Account | undefined> {
    const existing = await this.getById(id, userId);
    if (!existing) return undefined;

    const updates: Record<string, unknown> = {};
    if (patch.name !== undefined) updates.name = patch.name;
    if (patch.type !== undefined) updates.type = patch.type;

    if (Object.keys(updates).length === 0) return existing;

    updates.updatedAt = new Date().toISOString();

    await this.db
      .update(financeAccounts)
      .set(updates)
      .where(and(eq(financeAccounts.id, id), userScope(userId)));

    return await this.getById(id, userId);
  }

  async archive(id: string, userId: string): Promise<boolean> {
    const result = await this.db
      .update(financeAccounts)
      .set({ archived: 1, updatedAt: new Date().toISOString() })
      .where(and(eq(financeAccounts.id, id), userScope(userId)));
    return result.rowsAffected > 0;
  }

  async unarchive(id: string, userId: string): Promise<boolean> {
    const result = await this.db
      .update(financeAccounts)
      .set({ archived: 0, updatedAt: new Date().toISOString() })
      .where(and(eq(financeAccounts.id, id), userScope(userId)));
    return result.rowsAffected > 0;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const now = new Date().toISOString();
    const result = await this.db
      .update(financeAccounts)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(financeAccounts.id, id), userScope(userId)));
    return result.rowsAffected > 0;
  }
}
