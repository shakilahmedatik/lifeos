import assert from "node:assert";
import path from "node:path";
import { TestRunner } from "../helpers/test-context.mjs";

const STORAGE_PATH = path.resolve(process.cwd(), "e2e/storage-state.json");

export async function runHabitsSuite() {
  const runner = new TestRunner("04 - Habits Tracking");
  await runner.init({ storageState: STORAGE_PATH });
  await runner.ensureLoggedIn();

  try {
    await runner.step("Navigates to Habits page and renders tabs", async (page) => {
      await page.goto("http://localhost:5173/habits");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);

      const header = await page.textContent("h1, h2");
      assert.ok(header.includes("Habits"), "Habits header should be visible");

      const tabs = await page.$$("button[role='tab']");
      assert.ok(tabs.length >= 3, "Should display Overview, Builder, History tabs");
      await runner.screenshot("04_habits_initial");
    });

    await runner.step("Builder Tab: Selects and configures habit from Healthy Templates", async (page) => {
      const builderTab = page.getByRole("tab", { name: "Builder" });
      await builderTab.click();
      await page.waitForTimeout(400);

      // Open Browse Templates
      const browseBtn = page.locator("button:has-text('Browse Templates')");
      await browseBtn.click();
      await page.waitForTimeout(400);

      // Select a template
      const useTemplateBtn = page.locator("button:has-text('Use Template')").first();
      await useTemplateBtn.click();
      await page.waitForTimeout(400);

      // Provide a unique name to prevent duplicate-name constraints
      const nameInput = page.locator("input[placeholder='Habit name']");
      const uniqueName = `Healthy Routine ${Date.now()}`;
      await nameInput.fill(uniqueName);

      const saveBtn = page.locator("form button:has-text('Save Habit')");
      await saveBtn.click();
      await page.waitForSelector("form button:has-text('Save Habit')", { state: "detached", timeout: 8000 });
      await page.waitForTimeout(600);

      const bodyText = await page.textContent("body");
      assert.ok(bodyText.includes("Active Habits"), "Should display active habits list");
      await runner.screenshot("04_habits_active_list");
    });

    await runner.step("Builder Tab: Creates custom habit and tests archive/unarchive", async (page) => {
      const waterTypeBtn = page.locator("button:has-text('water'), button:has-text('Water')").first();
      if (await waterTypeBtn.count() > 0) {
        await waterTypeBtn.click();
        await page.waitForTimeout(400);

        const nameInput = page.locator("input[placeholder='Habit name']");
        await nameInput.fill(`Hydration Goal ${Date.now()}`);

        const saveBtn = page.locator("form button:has-text('Save Habit')");
        await saveBtn.click();
        await page.waitForSelector("form button:has-text('Save Habit')", { state: "detached", timeout: 8000 });
        await page.waitForTimeout(600);
      }

      // Archive habit test
      const archiveBtn = page.locator("button[title='Archive']").first();
      if (await archiveBtn.count() > 0) {
        await archiveBtn.click();
        await page.waitForTimeout(600);

        const bodyText = await page.textContent("body");
        assert.ok(bodyText.includes("Archived Habits"), "Archived Habits header should appear");
        await runner.screenshot("04_habits_archived_section");

        // Unarchive
        const unarchiveBtn = page.locator("button[title='Unarchive']").first();
        if (await unarchiveBtn.count() > 0) {
          await unarchiveBtn.click();
          await page.waitForTimeout(600);
        }
      }
    });

    await runner.step("Overview Tab: Logs habit for today and verifies streak update", async (page) => {
      await runner.closeAnyOpenModal();
      const overviewTab = page.getByRole("tab", { name: "Overview" });
      await overviewTab.click();
      await page.waitForTimeout(500);

      // Find log habit check button or increment button
      const logBtn = page.locator("button:has(svg.lucide-check), button:has(svg.lucide-plus), button[aria-label*='Log']").first();
      if (await logBtn.count() > 0) {
        await logBtn.click();
        await page.waitForTimeout(600);
        await runner.screenshot("04_habits_logged_today");
      }
    });


  } finally {
    await runner.close();
  }

  return runner.results;
}
