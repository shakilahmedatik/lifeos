import type { Client } from "@libsql/client";
import { SqliteAccountRepository } from "./adapters/sqlite/sqlite-account-repository.js";
import { SqliteCategoryRepository } from "./adapters/sqlite/sqlite-category-repository.js";
import { SqliteTransactionRepository } from "./adapters/sqlite/sqlite-transaction-repository.js";
import { createFinanceRouter } from "./api/router.js";
import { AccountService } from "./application/account-service.js";
import { CategoryService } from "./application/category-service.js";
import { FinanceReportService } from "./application/finance-report-service.js";
import { TransactionService } from "./application/transaction-service.js";

export function initFinanceModule(client: Client) {
  const accountRepo = new SqliteAccountRepository(client);
  const categoryRepo = new SqliteCategoryRepository(client);
  const transactionRepo = new SqliteTransactionRepository(client);

  const accountService = new AccountService(accountRepo, transactionRepo);
  const categoryService = new CategoryService(categoryRepo, transactionRepo);
  const transactionService = new TransactionService(transactionRepo, accountRepo, categoryRepo);
  const financeReportService = new FinanceReportService(transactionRepo, accountRepo, categoryRepo);

  const router = createFinanceRouter(
    accountService,
    categoryService,
    transactionService,
    financeReportService,
  );

  return {
    accountService,
    categoryService,
    transactionService,
    financeReportService,
    router,
  };
}
