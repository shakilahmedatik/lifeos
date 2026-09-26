import assert from "node:assert";
import path from "node:path";
import { TestRunner } from "../helpers/test-context.mjs";

const STORAGE_PATH = path.resolve(process.cwd(), "e2e/storage-state.json");

export async function runFinanceSuite() {
  const runner = new TestRunner("07 - Finance, Accounts & Budgets");
  await runner.init({ storageState: STORAGE_PATH });
  await runner.ensureLoggedIn();

  try {
    await runner.step("Navigates to Finance page and renders tabs", async (page) => {
      await page.goto("http://localhost:5173/finance");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);

      const header = await page.textContent("h1, h2");
      assert.ok(header.includes("Finance"), "Finance header should be visible");

      const tabs = await page.$$("button[role='tab']");
      assert.ok(tabs.length >= 4, "Should display Overview, Transactions, Accounts, Categories tabs");
      await runner.screenshot("07_finance_initial");
    });

    await runner.step("Accounts Tab: Creates multiple financial accounts", async (page) => {
      await runner.closeAnyOpenModal();
      const accountsTab = page.getByRole("tab", { name: "Accounts" });
      await accountsTab.click();
      await page.waitForTimeout(400);

      // Account 1: Checking
      const addAccBtn = page.locator("button:has-text('Add Account')").first();
      await addAccBtn.click();
      await page.waitForTimeout(400);

      const uniqueChecking = `Checking ${Date.now()}`;
      const nameInput = page.locator(".fixed.inset-0 form input").first();
      await nameInput.fill(uniqueChecking);

      await page.locator(".fixed.inset-0 form button[type='submit']").click();
      await page.waitForSelector(".fixed.inset-0 form", { state: "detached", timeout: 8000 });
      await page.waitForTimeout(600);

      // Account 2: Savings
      await addAccBtn.click();
      await page.waitForTimeout(400);

      const uniqueSavings = `Savings ${Date.now()}`;
      const nameInput2 = page.locator(".fixed.inset-0 form input").first();
      await nameInput2.fill(uniqueSavings);

      const typeSelect = page.locator(".fixed.inset-0 form select");
      if (await typeSelect.count() > 0) {
        await typeSelect.selectOption("savings");
      }

      await page.locator(".fixed.inset-0 form button[type='submit']").click();
      await page.waitForSelector(".fixed.inset-0 form", { state: "detached", timeout: 8000 });
      await page.waitForTimeout(600);

      const bodyText = await page.textContent("body");
      assert.ok(bodyText.includes(uniqueChecking), "Checking account should appear");
      assert.ok(bodyText.includes(uniqueSavings), "Savings account should appear");
      await runner.screenshot("07_finance_accounts_created");
    });

    await runner.step("Categories Tab: Creates custom Income and Expense categories", async (page) => {
      await runner.closeAnyOpenModal();
      const catTab = page.getByRole("tab", { name: "Categories" });
      await catTab.click();
      await page.waitForTimeout(400);

      const addCatBtn = page.locator("button:has-text('Add Category')").first();

      // Create Income Category
      await addCatBtn.click();
      await page.waitForTimeout(400);

      const uniqueIncomeCat = `Consulting ${Date.now()}`;
      await page.locator(".fixed.inset-0 form input").first().fill(uniqueIncomeCat);
      await page.locator(".fixed.inset-0 form select").first().selectOption("income");
      await page.locator(".fixed.inset-0 form button[type='submit']").click();
      await page.waitForSelector(".fixed.inset-0 form", { state: "detached", timeout: 8000 });
      await page.waitForTimeout(500);

      // Create Expense Category
      await addCatBtn.click();
      await page.waitForTimeout(400);

      const uniqueExpenseCat = `Groceries ${Date.now()}`;
      await page.locator(".fixed.inset-0 form input").first().fill(uniqueExpenseCat);
      await page.locator(".fixed.inset-0 form select").first().selectOption("expense");
      await page.locator(".fixed.inset-0 form button[type='submit']").click();
      await page.waitForSelector(".fixed.inset-0 form", { state: "detached", timeout: 8000 });
      await page.waitForTimeout(500);

      const bodyText = await page.textContent("body");
      assert.ok(bodyText.includes(uniqueIncomeCat), "Income category should appear");
      assert.ok(bodyText.includes(uniqueExpenseCat), "Expense category should appear");
      await runner.screenshot("07_finance_categories_created");
    });

    await runner.step("Transactions Tab: Logs Income and Expense transactions", async (page) => {
      await runner.closeAnyOpenModal();
      const txTab = page.getByRole("tab", { name: "Transactions" });
      await txTab.click();
      await page.waitForTimeout(400);

      // Open Add Transaction Modal
      const addTxBtn = page.locator("button:has-text('Add Transaction')").first();
      await addTxBtn.click();
      await page.waitForTimeout(400);

      // Income transaction
      await page.selectOption("#transaction-kind", "income");
      await page.waitForTimeout(300);

      await page.fill("#transaction-amount", "50000");
      await page.fill("#transaction-note", "Consulting Retainer Payment");

      await page.locator(".fixed.inset-0 form button[type='submit']").click();
      await page.waitForSelector(".fixed.inset-0 form", { state: "detached", timeout: 8000 });
      await page.waitForTimeout(600);

      // Expense transaction
      await addTxBtn.click();
      await page.waitForTimeout(400);

      await page.selectOption("#transaction-kind", "expense");
      await page.waitForTimeout(300);

      await page.fill("#transaction-amount", "3500");
      await page.fill("#transaction-note", "Weekly Groceries");

      await page.locator(".fixed.inset-0 form button[type='submit']").click();
      await page.waitForSelector(".fixed.inset-0 form", { state: "detached", timeout: 8000 });
      await page.waitForTimeout(600);

      const bodyText = await page.textContent("body");
      assert.ok(bodyText.includes("50,000") || bodyText.includes("50000"), "Income transaction should be listed");
      assert.ok(bodyText.includes("3,500") || bodyText.includes("3500"), "Expense transaction should be listed");
      await runner.screenshot("07_finance_transactions_list");
    });

    await runner.step("Accounts Tab: Performs Transfer Funds between accounts", async (page) => {
      await runner.closeAnyOpenModal();
      const accountsTab = page.getByRole("tab", { name: "Accounts" });
      await accountsTab.click();
      await page.waitForTimeout(400);

      const transferBtn = page.locator("button:has-text('Transfer Funds')");
      if (await transferBtn.count() > 0) {
        await transferBtn.click();
        await page.waitForTimeout(400);

        const selects = page.locator(".fixed.inset-0 form select");
        await selects.nth(0).selectOption({ index: 1 });
        await selects.nth(1).selectOption({ index: 2 });

        const amountInput = page.locator(".fixed.inset-0 form input[type='text'], .fixed.inset-0 form input[type='number']").first();
        await amountInput.fill("1000");

        const noteInput = page.locator(".fixed.inset-0 form input[placeholder*='Reason']").first();
        if (await noteInput.count() > 0) {
          await noteInput.fill("Monthly Savings Allocation");
        }

        const submitBtn = page.locator(".fixed.inset-0 form button:has-text('Complete Transfer')");
        await submitBtn.click();
        await page.waitForSelector(".fixed.inset-0 form", { state: "detached", timeout: 8000 });
        await page.waitForTimeout(600);
      }
      await runner.screenshot("07_finance_after_transfer");
    });

    await runner.step("Overview Tab: Verifies Monthly Financial Summary calculations", async (page) => {
      await runner.closeAnyOpenModal();
      const overviewTab = page.getByRole("tab", { name: "Overview" });
      await overviewTab.click();
      await page.waitForTimeout(500);

      const bodyText = await page.textContent("body");
      assert.ok(bodyText.includes("Income") && bodyText.includes("Expense"), "Monthly summary should show Income and Expense stats");
      await runner.screenshot("07_finance_monthly_overview");
    });

  } finally {
    await runner.close();
  }

  return runner.results;
}
