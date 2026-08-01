import type { AccountWithBalance, CategoryBreakdown, MonthlySummary } from "../domain/types.js";
import type { AccountRepository } from "../ports/account-repository.js";
import type { CategoryRepository } from "../ports/category-repository.js";
import type { TransactionRepository } from "../ports/transaction-repository.js";

export class FinanceReportService {
  constructor(
    private readonly transactionRepo: TransactionRepository,
    private readonly accountRepo: AccountRepository,
    private readonly categoryRepo: CategoryRepository,
  ) {}

  getMonthlySummary(yearMonth: string): MonthlySummary {
    const { totalIncome, totalExpense } = this.transactionRepo.getMonthlyTotals(yearMonth);
    return {
      yearMonth,
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
    };
  }

  getCategoryBreakdown(yearMonth: string): CategoryBreakdown[] {
    const breakdown = this.transactionRepo.getCategoryBreakdown(yearMonth);
    return breakdown.map((item) => {
      const category = this.categoryRepo.getById(item.categoryId);
      return {
        categoryId: item.categoryId,
        categoryName: category?.name ?? "Unknown",
        kind: category?.kind ?? "expense",
        total: item.total,
      };
    });
  }

  getAccountBalances(): AccountWithBalance[] {
    const accounts = this.accountRepo.getAll();
    return accounts.map((account) => ({
      ...account,
      balance: this.transactionRepo.getAccountBalance(account.id),
    }));
  }

  getMonthlyTransactions(yearMonth: string) {
    const [yearStr, monthStr] = yearMonth.split("-");
    const year = Number.parseInt(yearStr, 10);
    const month = Number.parseInt(monthStr, 10);
    const lastDay = new Date(year, month, 0).getDate();
    const startDate = `${yearMonth}-01`;
    const endDate = `${yearMonth}-${String(lastDay).padStart(2, "0")}`;
    return this.transactionRepo.getByDateRange(startDate, endDate);
  }
}
