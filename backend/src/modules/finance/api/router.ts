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
import type { AuthenticatedRequest } from "../../auth/middleware.js";
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
  router.get("/accounts", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || "";
    const accounts = await accountService.listAccounts(userId);
    res.json(accounts);
  });

  router.get("/accounts/active", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || "";
    const accounts = await accountService.listActiveAccounts(userId);
    res.json(accounts);
  });

  router.get("/accounts/:id", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || "";
    const account = await accountService.getAccount(req.params.id as string, userId);
    if (!account) {
      res.status(404).json({ error: "Account not found" });
      return;
    }
    res.json(account);
  });

  router.post(
    "/accounts",
    validateBody(NewAccountInputSchema),
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user?.id || "";
        const account = await accountService.createAccount(req.body, userId);
        res.status(201).json(account);
      } catch (error) {
        if (error instanceof Error) {
          res.status(400).json({ error: error.message });
          return;
        }
        throw error;
      }
    },
  );

  router.patch(
    "/accounts/:id",
    validateBody(UpdateAccountSchema),
    async (req: AuthenticatedRequest, res) => {
      const userId = req.user?.id || "";
      const account = await accountService.updateAccount(req.params.id as string, req.body, userId);
      if (!account) {
        res.status(404).json({ error: "Account not found" });
        return;
      }
      res.json(account);
    },
  );

  router.post("/accounts/:id/archive", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || "";
    const archived = await accountService.archiveAccount(req.params.id as string, userId);
    if (!archived) {
      res.status(404).json({ error: "Account not found" });
      return;
    }
    res.status(204).send();
  });

  router.post("/accounts/:id/unarchive", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || "";
    const unarchived = await accountService.unarchiveAccount(req.params.id as string, userId);
    if (!unarchived) {
      res.status(404).json({ error: "Account not found" });
      return;
    }
    res.status(204).send();
  });

  router.delete("/accounts/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id || "";
      const deleted = await accountService.deleteAccount(req.params.id as string, userId);
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

  router.get("/accounts/:id/balance", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || "";
    const account = await accountService.getAccount(req.params.id as string, userId);
    if (!account) {
      res.status(404).json({ error: "Account not found" });
      return;
    }
    const balance = await accountService.getAccountBalance(req.params.id as string, userId);
    res.json({ balance });
  });

  // Category routes
  router.get("/categories", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || "";
    const categories = await categoryService.listCategories(userId);
    res.json(categories);
  });

  router.get("/categories/active", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || "";
    const categories = await categoryService.listActiveCategories(userId);
    res.json(categories);
  });

  router.get("/categories/income", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || "";
    const categories = await categoryService.listByKind("income", userId);
    res.json(categories);
  });

  router.get("/categories/expense", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || "";
    const categories = await categoryService.listByKind("expense", userId);
    res.json(categories);
  });

  router.get("/categories/:id", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || "";
    const category = await categoryService.getCategory(req.params.id as string, userId);
    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.json(category);
  });

  router.post(
    "/categories",
    validateBody(NewCategoryInputSchema),
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user?.id || "";
        const category = await categoryService.createCategory(req.body, userId);
        res.status(201).json(category);
      } catch (error) {
        if (error instanceof Error) {
          res.status(400).json({ error: error.message });
          return;
        }
        throw error;
      }
    },
  );

  router.patch(
    "/categories/:id",
    validateBody(UpdateCategorySchema),
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user?.id || "";
        const category = await categoryService.updateCategory(
          req.params.id as string,
          req.body,
          userId,
        );
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
    },
  );

  router.post("/categories/:id/archive", async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id || "";
      const archived = await categoryService.archiveCategory(req.params.id as string, userId);
      if (!archived) {
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

  router.post("/categories/:id/unarchive", async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id || "";
      const unarchived = await categoryService.unarchiveCategory(req.params.id as string, userId);
      if (!unarchived) {
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

  router.delete("/categories/:id", async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id || "";
      const deleted = await categoryService.deleteCategory(req.params.id as string, userId);
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
  router.get("/transactions", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || "";
    const { startDate, endDate, accountId } = req.query;

    if (accountId && startDate && endDate) {
      const transactions = await transactionService.listTransactionsByAccountAndDateRange(
        accountId as string,
        startDate as string,
        endDate as string,
        userId,
      );
      res.json(transactions);
      return;
    }

    if (accountId) {
      const transactions = await transactionService.listTransactionsByAccount(
        accountId as string,
        userId,
      );
      res.json(transactions);
      return;
    }

    if (startDate && endDate) {
      const transactions = await transactionService.listTransactionsByDateRange(
        startDate as string,
        endDate as string,
        userId,
      );
      res.json(transactions);
      return;
    }

    res.status(400).json({ error: "startDate and endDate or accountId are required" });
  });

  router.get("/transactions/:id", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || "";
    const transaction = await transactionService.getTransaction(req.params.id as string, userId);
    if (!transaction) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }
    res.json(transaction);
  });

  router.post(
    "/transactions",
    validateBody(NewTransactionInputSchema),
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user?.id || "";
        const transaction = await transactionService.createTransaction(req.body, userId);
        res.status(201).json(transaction);
      } catch (error) {
        if (error instanceof Error) {
          res.status(400).json({ error: error.message });
          return;
        }
        throw error;
      }
    },
  );

  router.patch(
    "/transactions/:id",
    validateBody(UpdateTransactionSchema),
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user?.id || "";
        const transaction = await transactionService.updateTransaction(
          req.params.id as string,
          req.body,
          userId,
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
    },
  );

  router.delete("/transactions/:id", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || "";
    const deleted = await transactionService.deleteTransaction(req.params.id as string, userId);
    if (!deleted) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }
    res.status(204).send();
  });

  router.post(
    "/transfers",
    validateBody(TransferInputSchema),
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = req.user?.id || "";
        const { fromAccountId, toAccountId, amountMinor, date, note } = req.body;
        const result = await transactionService.createTransfer(
          fromAccountId,
          toAccountId,
          amountMinor,
          date,
          note,
          userId,
        );
        res.status(201).json(result);
      } catch (error) {
        if (error instanceof Error) {
          res.status(400).json({ error: error.message });
          return;
        }
        throw error;
      }
    },
  );

  // Report routes
  router.get("/monthly/:yearMonth", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || "";
    const summary = await financeReportService.getMonthlySummary(
      req.params.yearMonth as string,
      userId,
    );
    res.json(summary);
  });

  router.get("/monthly/:yearMonth/breakdown", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || "";
    const breakdown = await financeReportService.getCategoryBreakdown(
      req.params.yearMonth as string,
      userId,
    );
    res.json(breakdown);
  });

  router.get("/monthly/:yearMonth/transactions", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || "";
    const transactions = await financeReportService.getMonthlyTransactions(
      req.params.yearMonth as string,
      userId,
    );
    res.json(transactions);
  });

  router.get("/balances", async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id || "";
    const balances = await financeReportService.getAccountBalances(userId);
    res.json(balances);
  });

  return router;
}
