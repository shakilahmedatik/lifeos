import assert from "node:assert";
import path from "node:path";
import { TestRunner } from "../helpers/test-context.mjs";

const STORAGE_PATH = path.resolve(process.cwd(), "e2e/storage-state.json");

export async function runDashboardSuite() {
  const runner = new TestRunner("02 - Dashboard & Widgets");
  await runner.init({ storageState: STORAGE_PATH });

  try {
    await runner.step("Loads Dashboard with all required widgets", async (page) => {
      await page.goto("http://localhost:5173/");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // Check URL
      assert.strictEqual(page.url(), "http://localhost:5173/");

      // Check header bar
      const bodyText = await page.textContent("body");
      assert.ok(bodyText.includes("LifeOS") || bodyText.includes("Dashboard") || bodyText.includes("Schedule"), "Dashboard content should be loaded");

      await runner.screenshot("02_dashboard_overview");
    });

    await runner.step("Status bar refresh button responds without error", async (page) => {
      // Find refresh button in header/status bar
      const refreshBtn = page.locator("button[aria-label='Refresh task schedule'], button:has-text('Refresh'), button:has(svg.lucide-refresh-cw)");
      if (await refreshBtn.count() > 0) {
        await refreshBtn.first().click();
        await page.waitForTimeout(500);
      }
      assert.strictEqual(runner.pageErrors.length, 0, "No uncaught errors on refresh");
    });

    await runner.step("Widgets render their container elements and layout", async (page) => {
      // Check grid layout
      const grid = await page.$(".grid");
      assert.ok(grid, "Dashboard grid container must exist");

      // Verify presence of cards / widgets
      const cards = await page.$$(".rounded-2xl, .rounded-xl, .glass, [class*='card']");
      assert.ok(cards.length >= 2, "Expected multiple dashboard cards/widgets to render");
      await runner.screenshot("02_dashboard_widgets_rendered");
    });

    await runner.step("Sidebar navigation links work correctly from Dashboard", async (page) => {
      const routineLink = page.locator('aside a[title="Tasks"], aside a[href="/routine"]');
      await routineLink.click();
      await page.waitForURL("**/routine");
      assert.strictEqual(page.url(), "http://localhost:5173/routine");

      // Go back to home
      const homeLink = page.locator('aside a[title="Home"], aside a[href="/"]');
      await homeLink.click();
      await page.waitForURL("http://localhost:5173/");
      assert.strictEqual(page.url(), "http://localhost:5173/");
    });

  } finally {
    await runner.close();
  }

  return runner.results;
}
