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
  router.get("/accounts", async (_req, res) => {
    const accounts = await accountService.listAccounts();
    res.json(accounts);
  });

  router.get("/accounts/active", async (_req, res) => {
    const accounts = await accountService.listActiveAccounts();
    res.json(accounts);
  });

  router.get("/accounts/:id", async (req, res) => {
    const account = await accountService.getAccount(req.params.id);
    if (!account) {
      res.status(404).json({ error: "Account not found" });
      return;
    }
    res.json(account);
  });

  router.post("/accounts", validateBody(NewAccountInputSchema), async (req, res) => {
    try {
      const account = await accountService.createAccount(req.body);
      res.status(201).json(account);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      throw error;
    }
  });

  router.patch("/accounts/:id", validateBody(UpdateAccountSchema), async (req, res) => {
    const account = await accountService.updateAccount(req.params.id as string, req.body);
    if (!account) {
      res.status(404).json({ error: "Account not found" });
      return;
    }
    res.json(account);
  });

  router.post("/accounts/:id/archive", async (req, res) => {
    const archived = await accountService.archiveAccount(req.params.id);
    if (!archived) {
      res.status(404).json({ error: "Account not found" });
      return;
    }
    res.status(204).send();
  });

  router.post("/accounts/:id/unarchive", async (req, res) => {
    const unarchived = await accountService.unarchiveAccount(req.params.id);
    if (!unarchived) {
      res.status(404).json({ error: "Account not found" });
      return;
    }
    res.status(204).send();
  });

  router.delete("/accounts/:id", async (req, res) => {
    try {
      const deleted = await accountService.deleteAccount(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: "Account not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      throw error;
    }
  });

  router.get("/accounts/:id/balance", async (req, res) => {
    const account = await accountService.getAccount(req.params.id);
    if (!account) {
      res.status(404).json({ error: "Account not found" });
      return;
    }
    const balance = await accountService.getAccountBalance(req.params.id);
    res.json({ balance });
  });

  // Category routes
  router.get("/categories", async (_req, res) => {
    const categories = await categoryService.listCategories();
    res.json(categories);
  });

  router.get("/categories/active", async (_req, res) => {
    const categories = await categoryService.listActiveCategories();
    res.json(categories);
  });

  router.get("/categories/income", async (_req, res) => {
    const categories = await categoryService.listByKind("income");
    res.json(categories);
  });

  router.get("/categories/expense", async (_req, res) => {
    const categories = await categoryService.listByKind("expense");
    res.json(categories);
  });

  router.get("/categories/:id", async (req, res) => {
    const category = await categoryService.getCategory(req.params.id);
    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.json(category);
  });

  router.post("/categories", validateBody(NewCategoryInputSchema), async (req, res) => {
    try {
      const category = await categoryService.createCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      throw error;
    }
  });

  router.patch("/categories/:id", validateBody(UpdateCategorySchema), async (req, res) => {
    try {
      const category = await categoryService.updateCategory(req.params.id as string, req.body);
      if (!category) {
        res.status(404).json({ error: "Category not found" });
        return;
      }
      res.json(category);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      throw error;
    }
  });

  router.post("/categories/:id/archive", async (req, res) => {
    const archived = await categoryService.archiveCategory(req.params.id);
    if (!archived) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.status(204).send();
  });

  router.post("/categories/:id/unarchive", async (req, res) => {
    const unarchived = await categoryService.unarchiveCategory(req.params.id);
    if (!unarchived) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.status(204).send();
  });

  router.delete("/categories/:id", async (req, res) => {
    try {
      const deleted = await categoryService.deleteCategory(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: "Category not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      throw error;
    }
  });

  // Transaction routes
  router.get("/transactions", async (req, res) => {
    const { startDate, endDate, accountId } = req.query;

    if (accountId && startDate && endDate) {
      const transactions = await transactionService.listTransactionsByAccountAndDateRange(
        accountId as string,
        startDate as string,
        endDate as string,
      );
      res.json(transactions);
      return;
    }

    if (accountId) {
      const transactions = await transactionService.listTransactionsByAccount(accountId as string);
      res.json(transactions);
      return;
    }

    if (startDate && endDate) {
      const transactions = await transactionService.listTransactionsByDateRange(
        startDate as string,
        endDate as string,
      );
      res.json(transactions);
      return;
    }

    res.status(400).json({ error: "startDate and endDate or accountId are required" });
  });

  router.get("/transactions/:id", async (req, res) => {
    const transaction = await transactionService.getTransaction(req.params.id);
    if (!transaction) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }
    res.json(transaction);
  });

  router.post("/transactions", validateBody(NewTransactionInputSchema), async (req, res) => {
    try {
      const transaction = await transactionService.createTransaction(req.body);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      throw error;
    }
  });

  router.patch("/transactions/:id", validateBody(UpdateTransactionSchema), async (req, res) => {
    try {
      const transaction = await transactionService.updateTransaction(
        req.params.id as string,
        req.body,
      );
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

  router.delete("/transactions/:id", async (req, res) => {
    const deleted = await transactionService.deleteTransaction(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }
    res.status(204).send();
  });

  router.post("/transfers", validateBody(TransferInputSchema), async (req, res) => {
    try {
      const { fromAccountId, toAccountId, amountMinor, date, note } = req.body;
      const result = await transactionService.createTransfer(
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
  router.get("/monthly/:yearMonth", async (req, res) => {
    const summary = await financeReportService.getMonthlySummary(req.params.yearMonth);
    res.json(summary);
  });

  router.get("/monthly/:yearMonth/breakdown", async (req, res) => {
    const breakdown = await financeReportService.getCategoryBreakdown(req.params.yearMonth);
    res.json(breakdown);
  });

  router.get("/monthly/:yearMonth/transactions", async (req, res) => {
    const transactions = await financeReportService.getMonthlyTransactions(req.params.yearMonth);
    res.json(transactions);
  });

  router.get("/balances", async (_req, res) => {
    const balances = await financeReportService.getAccountBalances();
    res.json(balances);
  });

  return router;
}
