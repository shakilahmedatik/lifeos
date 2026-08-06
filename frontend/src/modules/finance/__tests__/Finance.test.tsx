// @vitest-environment jsdom
import type { Account, AccountWithBalance, Category, Transaction } from "@lifeos/contracts";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../../../components/Toast.js";
import { AccountList } from "../AccountList.js";
import * as financeApi from "../api.js";
import { BackupPanel } from "../BackupPanel.js";
import { CategoryList } from "../CategoryList.js";
import { FinanceWidget } from "../FinanceWidget.js";
import { MonthlyView } from "../MonthlyView.js";
import { TransactionList } from "../TransactionList.js";
import { TransferModal } from "../TransferModal.js";

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
});

const mockAccounts: Account[] = [
  {
    id: "acc-1",
    name: "Bank Account",
    type: "bank",
    archived: false,
    createdAt: "",
    updatedAt: "",
  },
  { id: "acc-2", name: "Cash Wallet", type: "cash", archived: false, createdAt: "", updatedAt: "" },
];

const mockAccountsWithBalance: AccountWithBalance[] = mockAccounts.map((a) => ({
  ...a,
  balance: a.id === "acc-1" ? 100000 : 50000,
}));

const mockCategories: Category[] = [
  {
    id: "cat-uuid-1",
    name: "Custom Freelance",
    kind: "income",
    archived: false,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "cat-uuid-2",
    name: "Custom Groceries",
    kind: "expense",
    archived: false,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "cat-uuid-3",
    name: "Archived Income",
    kind: "income",
    archived: true,
    createdAt: "",
    updatedAt: "",
  },
];

const mockTransactions: Transaction[] = [
  {
    id: "tx-1",
    accountId: "acc-1",
    categoryId: "cat-uuid-1",
    date: "2026-07-30",
    amountMinor: 500000,
    currency: "BDT",
    note: "Freelance Payment",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "tx-2",
    accountId: "acc-2",
    categoryId: "cat-uuid-2",
    date: "2026-07-30",
    amountMinor: 150000,
    currency: "BDT",
    note: "Supermarket Shopping",
    createdAt: "",
    updatedAt: "",
  },
];

describe("Finance Frontend Components", () => {
  it("renders TransferModal and handles transfers", async () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();
    const createTransferSpy = vi.spyOn(financeApi, "createTransfer").mockResolvedValue({
      from: mockTransactions[1],
      to: mockTransactions[0],
    });

    render(
      <ToastProvider>
        <TransferModal
          open={true}
          onClose={handleClose}
          onSuccess={handleSuccess}
          accounts={mockAccounts}
        />
      </ToastProvider>,
    );

    expect(screen.getByText("Transfer Between Accounts")).toBeDefined();

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "acc-1" } });
    fireEvent.change(selects[1], { target: { value: "acc-2" } });

    const amountInput = screen.getByLabelText(/Amount/i);
    fireEvent.change(amountInput, { target: { value: "100" } });

    const submitBtn = screen.getByRole("button", { name: /Complete Transfer/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createTransferSpy).toHaveBeenCalledWith(
        "acc-1",
        "acc-2",
        10000,
        expect.any(String),
        undefined,
      );
      expect(handleSuccess).toHaveBeenCalled();
    });
  });

  it("TransactionList separates earnings and expenses", async () => {
    vi.spyOn(financeApi, "fetchTransactionsByDateRange").mockResolvedValue(mockTransactions);
    vi.spyOn(financeApi, "fetchCategories").mockResolvedValue(mockCategories);
    vi.spyOn(financeApi, "fetchAccounts").mockResolvedValue(mockAccounts);

    render(
      <ToastProvider>
        <TransactionList />
      </ToastProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Income/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Expenses/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Custom Freelance")).toBeDefined();
      expect(screen.getByText("Custom Groceries")).toBeDefined();
    });

    const incomeAmount = screen.getAllByText(/\+ BDT 5,000.00/)[0];
    expect(incomeAmount).toBeDefined();
    expect(incomeAmount.className).toContain("text-emerald-400");

    const expenseAmount = screen.getAllByText(/- BDT 1,500.00/)[0];
    expect(expenseAmount).toBeDefined();
    expect(expenseAmount.className).toContain("text-amber-400");
  });

  it("FinanceWidget renders monthly finance summary", async () => {
    vi.spyOn(financeApi, "fetchMonthlySummary").mockResolvedValue({
      yearMonth: "2026-07",
      totalIncome: 1000000,
      totalExpense: 400000,
      net: 600000,
    });
    vi.spyOn(financeApi, "fetchCategoryBreakdown").mockResolvedValue([]);
    vi.spyOn(financeApi, "fetchAccountBalances").mockResolvedValue([]);

    render(
      <ToastProvider>
        <FinanceWidget />
      </ToastProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Finance This Month")).toBeDefined();
    });

    expect(screen.getByText("BDT 10,000")).toBeDefined();
    expect(screen.getByText("BDT 4,000")).toBeDefined();
    expect(screen.getByText("BDT 6,000")).toBeDefined();
  });

  it("AccountList renders with delete and archive buttons", async () => {
    vi.spyOn(financeApi, "fetchAccountBalances").mockResolvedValue(mockAccountsWithBalance);

    render(
      <ToastProvider>
        <AccountList />
      </ToastProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Financial Accounts" })).toBeDefined();
    });

    const editButtons = screen.getAllByTitle("Edit Account");
    expect(editButtons.length).toBe(2);

    const archiveButtons = screen.getAllByTitle("Archive Account");
    expect(archiveButtons.length).toBe(2);

    const deleteButtons = screen.getAllByTitle("Delete Account");
    expect(deleteButtons.length).toBe(2);
  });

  it("AccountList handles delete", async () => {
    const deleteSpy = vi.spyOn(financeApi, "deleteAccount").mockResolvedValue(undefined);
    vi.spyOn(financeApi, "fetchAccountBalances").mockResolvedValue(mockAccountsWithBalance);

    render(
      <ToastProvider>
        <AccountList />
      </ToastProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Financial Accounts" })).toBeDefined();
    });

    const deleteButtons = screen.getAllByTitle("Delete Account");
    fireEvent.click(deleteButtons[0]);

    const modalDeleteBtn = await screen.findByRole("button", { name: "Delete" });
    fireEvent.click(modalDeleteBtn);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith("acc-1");
    });
  });

  it("CategoryList shows income and expense categories", async () => {
    vi.spyOn(financeApi, "fetchCategories").mockResolvedValue(mockCategories);

    render(
      <ToastProvider>
        <CategoryList />
      </ToastProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Income Categories")).toBeDefined();
      expect(screen.getByText("Expense Categories")).toBeDefined();
    });

    const freelanceElements = screen.getAllByText("Custom Freelance");
    expect(freelanceElements.length).toBeGreaterThan(0);

    const groceriesElements = screen.getAllByText("Custom Groceries");
    expect(groceriesElements.length).toBeGreaterThan(0);
  });

  it("CategoryList shows archive/unarchive/delete buttons for active and archived categories", async () => {
    vi.spyOn(financeApi, "fetchCategories").mockResolvedValue(mockCategories);

    render(
      <ToastProvider>
        <CategoryList />
      </ToastProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Income Categories")).toBeDefined();
    });

    const archiveButtons = screen.getAllByTitle("Archive Category");
    expect(archiveButtons.length).toBeGreaterThanOrEqual(2);

    const deleteButtons = screen.getAllByTitle("Delete Category");
    expect(deleteButtons.length).toBeGreaterThanOrEqual(2);

    const unarchiveButtons = screen.getAllByText("Unarchive");
    expect(unarchiveButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("MonthlyView renders summary and breakdown sections", async () => {
    vi.spyOn(financeApi, "fetchMonthlySummary").mockResolvedValue({
      yearMonth: "2026-07",
      totalIncome: 1000000,
      totalExpense: 400000,
      net: 600000,
    });
    vi.spyOn(financeApi, "fetchCategoryBreakdown").mockResolvedValue([
      { categoryId: "cat-uuid-1", categoryName: "Freelance", kind: "income", total: 600000 },
      { categoryId: "cat-uuid-2", categoryName: "Groceries", kind: "expense", total: 300000 },
      { categoryId: "cat-uuid-3", categoryName: "Rent", kind: "expense", total: 100000 },
    ]);
    vi.spyOn(financeApi, "fetchAccountBalances").mockResolvedValue(mockAccountsWithBalance);

    render(
      <ToastProvider>
        <MonthlyView />
      </ToastProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Monthly Overview")).toBeDefined();
    });

    expect(screen.getByText("Expense by Category")).toBeDefined();
    expect(screen.getByText("Income by Category")).toBeDefined();
    expect(screen.getByText("Expense vs Income")).toBeDefined();

    expect(screen.getAllByText("BDT 10,000.00").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("BDT 4,000.00").length).toBeGreaterThanOrEqual(1);
  });

  it("BackupPanel renders CSV and JSON export options", () => {
    render(
      <ToastProvider>
        <BackupPanel />
      </ToastProvider>,
    );

    expect(screen.getByText("Export Transactions (CSV)")).toBeDefined();
    expect(screen.getByText("Export Full Backup (JSON)")).toBeDefined();
    expect(screen.getByText("Restore Data from JSON Backup")).toBeDefined();
  });
});
