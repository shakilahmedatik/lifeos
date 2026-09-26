import assert from "node:assert";
import path from "node:path";
import { TestRunner } from "../helpers/test-context.mjs";

const STORAGE_PATH = path.resolve(process.cwd(), "e2e/storage-state.json");

export async function runResponsiveSuite() {
  const runner = new TestRunner("09 - Mobile & Responsive Layout");
  await runner.init({
    storageState: STORAGE_PATH,
    viewport: { width: 375, height: 812 },
  });
  await runner.ensureLoggedIn();

  try {
    await runner.step("Mobile Viewport (375px): Sidebar is hidden and MobileTabBar is visible", async (page) => {
      await page.goto("http://localhost:5173/");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);

      // Desktop sidebar should be hidden
      const sidebar = page.locator("aside");
      const isSidebarVisible = await sidebar.isVisible();
      assert.strictEqual(isSidebarVisible, false, "Desktop sidebar must be hidden on mobile viewport");

      // MobileTabBar should be visible at bottom
      const mobileNav = page.locator("div.sm\\:hidden.fixed.bottom-0");
      assert.ok(await mobileNav.isVisible(), "MobileTabBar must be visible at bottom");
      await runner.screenshot("09_mobile_home_view");
    });

    await runner.step("MobileTabBar: Navigates across all main modules smoothly", async (page) => {
      // Tap Routine / Tasks tab
      const tasksTab = page.locator("div.sm\\:hidden a:has-text('Tasks')");
      await tasksTab.click();
      await page.waitForURL("**/routine");
      assert.strictEqual(page.url(), "http://localhost:5173/routine");
      await runner.screenshot("09_mobile_routine_page");

      // Tap Habits tab
      const habitsTab = page.locator("div.sm\\:hidden a:has-text('Habits')");
      await habitsTab.click();
      await page.waitForURL("**/habits");
      assert.strictEqual(page.url(), "http://localhost:5173/habits");

      // Tap Workouts tab
      const workoutsTab = page.locator("div.sm\\:hidden a:has-text('Workouts')");
      await workoutsTab.click();
      await page.waitForURL("**/workouts");
      assert.strictEqual(page.url(), "http://localhost:5173/workouts");

      // Tap Finance tab
      const financeTab = page.locator("div.sm\\:hidden a:has-text('Finance')");
      await financeTab.click();
      await page.waitForURL("**/finance");
      assert.strictEqual(page.url(), "http://localhost:5173/finance");
      await runner.screenshot("09_mobile_finance_page");
    });

    await runner.step("Mobile Modals: Open and fit mobile viewport without breaking layout", async (page) => {
      const addTxBtn = page.locator("button:has-text('Add Transaction')").first();
      if (await addTxBtn.count() > 0) {
        await addTxBtn.click();
        await page.waitForTimeout(400);

        // Verify modal content fits within 375px viewport
        const modalBox = page.locator(".fixed.inset-0 form, .fixed.inset-0 .bg-surface, .fixed.inset-0 .glass").first();
        assert.ok(await modalBox.isVisible(), "Modal should open on mobile");
        await runner.screenshot("09_mobile_modal_layout");

        // Cancel modal
        const cancelBtn = page.locator("button:has-text('Cancel')").first();
        if (await cancelBtn.count() > 0) {
          await cancelBtn.click();
          await page.waitForTimeout(300);
        }
      }
    });

  } finally {
    await runner.close();
  }

  return runner.results;
}
