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

  async getMonthlySummary(yearMonth: string): Promise<MonthlySummary> {
    const { totalIncome, totalExpense } = await this.transactionRepo.getMonthlyTotals(yearMonth);
    return {
      yearMonth,
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
    };
  }

  async getCategoryBreakdown(yearMonth: string): Promise<CategoryBreakdown[]> {
    const breakdown = await this.transactionRepo.getCategoryBreakdown(yearMonth);
    const results: CategoryBreakdown[] = [];
    for (const item of breakdown) {
      const category = await this.categoryRepo.getById(item.categoryId);
      results.push({
        categoryId: item.categoryId,
        categoryName: category?.name ?? "Unknown",
        kind: category?.kind ?? "expense",
        total: item.total,
      });
    }
    return results;
  }

  async getAccountBalances(): Promise<AccountWithBalance[]> {
    const accounts = await this.accountRepo.getAll();
    const results: AccountWithBalance[] = [];
    for (const account of accounts) {
      const balance = await this.transactionRepo.getAccountBalance(account.id);
      results.push({
        ...account,
        balance,
      });
    }
    return results;
  }

  async getMonthlyTransactions(yearMonth: string) {
    const [yearStr, monthStr] = yearMonth.split("-");
    const year = Number.parseInt(yearStr, 10);
    const month = Number.parseInt(monthStr, 10);
    const lastDay = new Date(year, month, 0).getDate();
    const startDate = `${yearMonth}-01`;
    const endDate = `${yearMonth}-${String(lastDay).padStart(2, "0")}`;
    return await this.transactionRepo.getByDateRange(startDate, endDate);
  }
}
