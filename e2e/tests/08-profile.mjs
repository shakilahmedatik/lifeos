import assert from "node:assert";
import path from "node:path";
import { TestRunner } from "../helpers/test-context.mjs";

const STORAGE_PATH = path.resolve(process.cwd(), "e2e/storage-state.json");

export async function runProfileSuite() {
  const runner = new TestRunner("08 - Profile, Theme & System Settings");
  await runner.init({ storageState: STORAGE_PATH });
  await runner.ensureLoggedIn();

  try {
    await runner.step("Navigates to Profile page and displays all sections on one page without tabs", async (page) => {
      await page.goto("http://localhost:5173/profile");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);

      const header = await page.textContent("h1, h2");
      assert.ok(header.includes("Profile") || header.includes("Settings"), "Profile header should be visible");

      // Verify all sections exist on the single page without clicking tabs
      const bodyText = await page.textContent("body");
      assert.ok(bodyText.includes("Personal Details"), "Personal Details section must be visible");
      assert.ok(bodyText.includes("Security & Session"), "Security & Session section must be visible");
      assert.ok(bodyText.includes("System Preferences"), "System Preferences section must be visible");
      assert.ok(bodyText.includes("System & Storage Health") || bodyText.includes("Backend Server"), "System Health section must be visible");

      // Verify no tablist/tab bar is present
      const tabTriggers = await page.$$("div[role='tablist'], button[role='tab']");
      assert.strictEqual(tabTriggers.length, 0, "No unnecessary tabs should be present on profile page");

      await runner.screenshot("08_profile_single_page_layout");
    });

    await runner.step("Account Details: Updates user display name", async (page) => {
      const uniqueName = `Explorer ${Date.now()}`;
      const nameInput = page.locator("input[placeholder='Your Full Name']");
      await nameInput.fill(uniqueName);

      const saveBtn = page.locator("button:has-text('Save Profile')");
      assert.ok(await saveBtn.isEnabled(), "Save Profile button should be enabled after modifying name");

      await saveBtn.click();
      await page.waitForTimeout(1000);

      const bodyText = await page.textContent("body");
      assert.ok(bodyText.includes("updated successfully") || bodyText.includes(uniqueName), "Profile update confirmation should appear");
      await runner.screenshot("08_profile_name_updated");
    });

    await runner.step("System Preferences: Toggles Dark / Light mode theme", async (page) => {
      // Directly click Light Mode (no tab switching needed)
      const lightModeBtn = page.locator("button:has-text('Light Mode')").first();
      await lightModeBtn.click();
      await page.waitForTimeout(500);

      let htmlClass = await page.evaluate(() => document.documentElement.className);
      assert.ok(htmlClass.includes("light"), "HTML element should have light class when Light Mode is selected");
      await runner.screenshot("08_profile_light_theme");

      // Switch back to Dark Mode
      const darkModeBtn = page.locator("button:has-text('Dark Mode')").first();
      await darkModeBtn.click();
      await page.waitForTimeout(500);

      htmlClass = await page.evaluate(() => document.documentElement.className);
      assert.ok(!htmlClass.includes("light"), "HTML element should remove light class for dark mode");
      await runner.screenshot("08_profile_dark_theme");
    });

    await runner.step("Security & Session: Sign Out confirmation flow and re-login", async (page) => {
      // Directly click Sign Out button (no tab switching needed)
      const signOutBtn = page.locator("button:has-text('Sign Out')").first();
      await signOutBtn.click();
      await page.waitForTimeout(400);

      // Confirm dialog should open
      const cancelBtn = page.locator("button:has-text('Cancel')").last();
      assert.ok(await cancelBtn.count() > 0, "Confirm dialog Cancel button should be visible");
      await runner.screenshot("08_profile_logout_confirm_dialog");

      // Cancel first
      await cancelBtn.click();
      await page.waitForTimeout(300);
      assert.strictEqual(page.url(), "http://localhost:5173/profile", "User should stay on profile after cancelling logout");

      // Now click Sign Out and confirm
      await signOutBtn.click();
      await page.waitForTimeout(300);

      const confirmSignOut = page.locator("button:has-text('Sign Out')").last();
      await confirmSignOut.click();
      await page.waitForTimeout(1000);

      // Verify returned to AuthModal
      const submitBtn = await page.$('button[type="submit"]');
      const btnText = await submitBtn?.textContent();
      assert.ok(btnText?.includes("Sign In to LifeOS"), "User should be logged out and see AuthModal");
      await runner.screenshot("08_profile_logged_out_modal");

      // Log back in
      await page.fill('input[type="email"]', "tester@lifeos.local");
      await page.fill('input[type="password"]', "Password123!");
      await page.click('button[type="submit"]');
      await page.waitForSelector("aside:visible, nav:visible", { timeout: 8000 });
      await page.waitForTimeout(500);
      await runner.screenshot("08_profile_relogged_in");
    });

  } finally {
    await runner.close();
  }

  return runner.results;
}
