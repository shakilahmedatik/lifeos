import type { DrizzleClient } from "../../shared/db.js";
import { DrizzleAccountRepository } from "./adapters/sqlite/sqlite-account-repository.js";
import { DrizzleCategoryRepository } from "./adapters/sqlite/sqlite-category-repository.js";
import { DrizzleTransactionRepository } from "./adapters/sqlite/sqlite-transaction-repository.js";
import { createFinanceRouter } from "./api/router.js";
import { AccountService } from "./application/account-service.js";
import { CategoryService } from "./application/category-service.js";
import { FinanceReportService } from "./application/finance-report-service.js";
import { TransactionService } from "./application/transaction-service.js";

export function initFinanceModule(db: DrizzleClient) {
  const accountRepo = new DrizzleAccountRepository(db);
  const categoryRepo = new DrizzleCategoryRepository(db);
  const transactionRepo = new DrizzleTransactionRepository(db);

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
