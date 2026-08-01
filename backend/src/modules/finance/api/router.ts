import {
  NewAccountInputSchema,
  NewCategoryInputSchema,
  NewTransactionInputSchema,
  TransferInputSchema,
  UpdateAccountSchema,
  UpdateCategorySchema,
  UpdateTransactionSchema,
} from "@lifeos/contracts";
import { Router } from "express";
import { validateBody } from "../../../shared/validate.js";
import type { AccountService } from "../application/account-service.js";
import type { CategoryService } from "../application/category-service.js";
import type { FinanceReportService } from "../application/finance-report-service.js";
import type { TransactionService } from "../application/transaction-service.js";

export function createFinanceRouter(
  accountService: AccountService,
  categoryService: CategoryService,
  transactionService: TransactionService,
  financeReportService: FinanceReportService,
): Router {
  const router = Router();

  // Account routes
  router.get("/accounts", (_req, res) => {
    const accounts = accountService.listAccounts();
    res.json(accounts);
  });

  router.get("/accounts/active", (_req, res) => {
    const accounts = accountService.listActiveAccounts();
    res.json(accounts);
  });

  router.get("/accounts/:id", (req, res) => {
    const account = accountService.getAccount(req.params.id);
    if (!account) {
      res.status(404).json({ error: "Account not found" });
      return;
    }
    res.json(account);
  });

  router.post("/accounts", validateBody(NewAccountInputSchema), (req, res) => {
    try {
      const account = accountService.createAccount(req.body);
      res.status(201).json(account);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      throw error;
    }
  });

  router.patch("/accounts/:id", validateBody(UpdateAccountSchema), (req, res) => {
    const account = accountService.updateAccount(req.params.id as string, req.body);
    if (!account) {
      res.status(404).json({ error: "Account not found" });
      return;
    }
    res.json(account);
  });

  router.post("/accounts/:id/archive", (req, res) => {
    const archived = accountService.archiveAccount(req.params.id);
    if (!archived) {
      res.status(404).json({ error: "Account not found" });
      return;
    }
    res.status(204).send();
  });

  router.post("/accounts/:id/unarchive", (req, res) => {
    const unarchived = accountService.unarchiveAccount(req.params.id);
    if (!unarchived) {
      res.status(404).json({ error: "Account not found" });
      return;
    }
    res.status(204).send();
  });

  router.delete("/accounts/:id", (req, res) => {
    const deleted = accountService.deleteAccount(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Account not found" });
      return;
    }
    res.status(204).send();
  });

  router.get("/accounts/:id/balance", (req, res) => {
    const account = accountService.getAccount(req.params.id);
    if (!account) {
      res.status(404).json({ error: "Account not found" });
      return;
    }
    const balance = accountService.getAccountBalance(req.params.id);
    res.json({ balance });
  });

  // Category routes
  router.get("/categories", (_req, res) => {
    const categories = categoryService.listCategories();
    res.json(categories);
  });

  router.get("/categories/active", (_req, res) => {
    const categories = categoryService.listActiveCategories();
    res.json(categories);
  });

  router.get("/categories/income", (_req, res) => {
    const categories = categoryService.listByKind("income");
    res.json(categories);
  });

  router.get("/categories/expense", (_req, res) => {
    const categories = categoryService.listByKind("expense");
    res.json(categories);
  });

  router.get("/categories/:id", (req, res) => {
    const category = categoryService.getCategory(req.params.id);
    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.json(category);
  });

  router.post("/categories", validateBody(NewCategoryInputSchema), (req, res) => {
    try {
      const category = categoryService.createCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      throw error;
    }
  });

  router.patch("/categories/:id", validateBody(UpdateCategorySchema), (req, res) => {
    const category = categoryService.updateCategory(req.params.id as string, req.body);
    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.json(category);
  });

  router.post("/categories/:id/archive", (req, res) => {
    const archived = categoryService.archiveCategory(req.params.id);
    if (!archived) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.status(204).send();
  });

  router.post("/categories/:id/unarchive", (req, res) => {
    const unarchived = categoryService.unarchiveCategory(req.params.id);
    if (!unarchived) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.status(204).send();
  });

  router.delete("/categories/:id", (req, res) => {
    const deleted = categoryService.deleteCategory(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.status(204).send();
  });

  // Transaction routes
  router.get("/transactions", (req, res) => {
    const { startDate, endDate, accountId } = req.query;

    if (accountId) {
      const transactions = transactionService.listTransactionsByAccount(accountId as string);
      res.json(transactions);
      return;
    }

    if (startDate && endDate) {
      const transactions = transactionService.listTransactionsByDateRange(
        startDate as string,
        endDate as string,
      );
      res.json(transactions);
      return;
    }

    res.status(400).json({ error: "startDate and endDate or accountId are required" });
  });

  router.get("/transactions/:id", (req, res) => {
    const transaction = transactionService.getTransaction(req.params.id);
    if (!transaction) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }
    res.json(transaction);
  });

  router.post("/transactions", validateBody(NewTransactionInputSchema), (req, res) => {
    try {
      const transaction = transactionService.createTransaction(req.body);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      throw error;
    }
  });

  router.patch("/transactions/:id", validateBody(UpdateTransactionSchema), (req, res) => {
    try {
      const transaction = transactionService.updateTransaction(req.params.id as string, req.body);
      if (!transaction) {
        res.status(404).json({ error: "Transaction not found" });
        return;
      }
      res.json(transaction);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      throw error;
    }
  });

  router.delete("/transactions/:id", (req, res) => {
    const deleted = transactionService.deleteTransaction(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }
    res.status(204).send();
  });

  router.post("/transfers", validateBody(TransferInputSchema), (req, res) => {
    try {
      const { fromAccountId, toAccountId, amountMinor, date, note } = req.body;
      const result = transactionService.createTransfer(
        fromAccountId,
        toAccountId,
        amountMinor,
        date,
        note,
      );
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      throw error;
    }
  });

  // Report routes
  router.get("/monthly/:yearMonth", (req, res) => {
    const summary = financeReportService.getMonthlySummary(req.params.yearMonth);
    res.json(summary);
  });

  router.get("/monthly/:yearMonth/breakdown", (req, res) => {
    const breakdown = financeReportService.getCategoryBreakdown(req.params.yearMonth);
    res.json(breakdown);
  });

  router.get("/monthly/:yearMonth/transactions", (req, res) => {
    const transactions = financeReportService.getMonthlyTransactions(req.params.yearMonth);
    res.json(transactions);
  });

  router.get("/balances", (_req, res) => {
    const balances = financeReportService.getAccountBalances();
    res.json(balances);
  });

  return router;
}
