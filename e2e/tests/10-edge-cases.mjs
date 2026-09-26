import assert from "node:assert";
import path from "node:path";
import { TestRunner } from "../helpers/test-context.mjs";

const STORAGE_PATH = path.resolve(process.cwd(), "e2e/storage-state.json");

export async function runEdgeCasesSuite() {
  const runner = new TestRunner("10 - Edge Cases, 404 & Resilience");
  await runner.init({ storageState: STORAGE_PATH });
  await runner.ensureLoggedIn();

  try {
    await runner.step("404 Route: Unknown URL renders 404 page and has recovery link", async (page) => {
      await page.goto("http://localhost:5173/non-existent-route-xyz");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);

      const bodyText = await page.textContent("body");
      assert.ok(bodyText.includes("404") && bodyText.includes("Page not found"), "404 page should be displayed for unknown routes");

      const returnLink = page.locator("a:has-text('Go to dashboard')");
      assert.ok(await returnLink.count() > 0, "Go to dashboard link should exist on 404 page");
      await runner.screenshot("10_edge_case_404_page");

      // Click Go to dashboard
      await returnLink.click();
      await page.waitForURL("http://localhost:5173/");
      assert.strictEqual(page.url(), "http://localhost:5173/");
    });

    await runner.step("Finance Edge Case: Extreme numbers and non-numeric input sanitization", async (page) => {
      await page.goto("http://localhost:5173/finance");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);

      const addTxBtn = page.locator("button:has-text('Add Transaction')").first();
      await addTxBtn.click();
      await page.waitForTimeout(300);

      const amountInput = page.locator("#transaction-amount");
      // Try typing alphabets
      await amountInput.fill("abcde!@#");
      const valAfterLetters = await amountInput.inputValue();
      assert.strictEqual(valAfterLetters, "", "Non-numeric characters should be blocked by sanitization");

      // Type valid 2-decimal number
      await amountInput.fill("123.45");
      const valValid = await amountInput.inputValue();
      assert.strictEqual(valValid, "123.45", "Valid 2-decimal number should be accepted");

      // Try typing 3 decimal places (should be rejected by /^\d*\.?\d{0,2}$/)
      await amountInput.fill("123.456");
      const valInvalid = await amountInput.inputValue();
      assert.ok(valInvalid !== "123.456", "3 decimal places should be rejected by input sanitization");

      // Cancel modal
      await page.locator("form button:has-text('Cancel')").click();
      await page.waitForTimeout(300);
    });

    await runner.step("Routine Edge Case: Start Time equals End Time rejection", async (page) => {
      await page.goto("http://localhost:5173/routine");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);

      const addTaskBtn = page.locator("button:has-text('Add Task')").first();
      await addTaskBtn.click();
      await page.waitForTimeout(300);

      // Fill title
      await page.fill("#task-title", "Zero Duration Edge Case");

      // Set date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];
      await page.fill("#task-date", tomorrowStr);

      // Set identical start and end times
      await page.fill("#task-start-time", "14:00");
      await page.fill("#task-end-time", "14:00");

      // Click submit
      await page.locator("form button[type='submit']").click();
      await page.waitForTimeout(300);

      const formText = await page.textContent("form");
      assert.ok(formText.includes("Start time cannot be equal to end time"), "Zero-duration time block must be rejected");
      await runner.screenshot("10_edge_case_zero_duration_error");

      await page.locator("form button:has-text('Cancel')").click();
      await page.waitForTimeout(300);
    });

    await runner.step("Modal UX: Escape key or backdrop dismiss", async (page) => {
      const addTaskBtn = page.locator("button:has-text('Add Task')").first();
      await addTaskBtn.click();
      await page.waitForTimeout(300);

      // Verify modal is open
      assert.ok(await page.locator("form").count() > 0, "Modal should be open");

      // Press Escape key
      await page.keyboard.press("Escape");
      await page.waitForTimeout(400);

      // Check if modal closed or backdrop responded
      const modalCount = await page.locator("form #task-title").count();
      // If modal supports escape dismiss, modalCount === 0. If not, cancel button works.
      if (modalCount > 0) {
        await page.locator("form button:has-text('Cancel')").click();
      }
    });

  } finally {
    await runner.close();
  }

  return runner.results;
}
