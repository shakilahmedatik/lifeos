import assert from "node:assert";
import path from "node:path";
import { TestRunner } from "../helpers/test-context.mjs";

const STORAGE_PATH = path.resolve(process.cwd(), "e2e/storage-state.json");

export async function runAuthSuite() {
  const runner = new TestRunner("01 - Authentication & Session");
  await runner.init();

  try {
    await runner.step("Renders AuthModal when unauthenticated", async (page) => {
      await page.goto("http://localhost:5173");
      await page.waitForLoadState("networkidle");

      const title = await page.textContent("h2");
      assert.strictEqual(title?.trim(), "LifeOS", "Brand title LifeOS should be visible");

      const submitBtn = await page.$('button[type="submit"]');
      const btnText = await submitBtn?.textContent();
      assert.ok(btnText?.includes("Sign In to LifeOS"), "Sign In button should be displayed");
      await runner.screenshot("01_auth_modal_initial");
    });

    await runner.step("Toggles between Sign In and Create Account modes", async (page) => {
      // Click Create Account tab in segmented control
      const createAccountTab = page.locator(".grid button:has-text('Create Account')").first();
      await createAccountTab.click();
      await page.waitForTimeout(300);

      // Verify Full Name input appears
      const nameInput = await page.$('input[placeholder="Alex Morgan"]');
      assert.ok(nameInput, "Full Name input should appear in register mode");

      const submitBtn = await page.$('button[type="submit"]');
      const btnText = await submitBtn?.textContent();
      assert.ok(btnText?.includes("Create LifeOS Account"), "Button text should update to Create LifeOS Account");
      await runner.screenshot("01_auth_modal_register_mode");

      // Switch back to Sign In tab in segmented control
      const signInTab = page.locator(".grid button:has-text('Sign In')").first();
      await signInTab.click();
      await page.waitForTimeout(300);

      const nameInputAfter = await page.$('input[placeholder="Alex Morgan"]');
      assert.strictEqual(nameInputAfter, null, "Full Name input should disappear in login mode");
    });

    await runner.step("Toggles password visibility", async (page) => {
      const passInput = page.locator('input[placeholder="••••••••••••"]');
      const passToggleBtn = page.locator("form div.relative button[type='button']");

      assert.strictEqual(await passInput.getAttribute("type"), "password");
      await passToggleBtn.click();
      assert.strictEqual(await passInput.getAttribute("type"), "text");
      await passToggleBtn.click();
      assert.strictEqual(await passInput.getAttribute("type"), "password");
    });

    await runner.step("Displays error banner on invalid login credentials", async (page) => {
      await page.fill('input[type="email"]', "nonexistent_user@lifeos.local");
      await page.fill('input[type="password"]', "WrongPassword123!");
      await page.click('button[type="submit"]');

      // Wait for error banner
      const errorMsg = await page.waitForSelector("form p.text-danger", { timeout: 8000 });
      const errText = await errorMsg.textContent();
      assert.ok(errText.includes("Invalid") || errText.includes("failed") || errText.includes("error"), "Error banner should state invalid credentials");
      await runner.screenshot("01_auth_invalid_credentials_banner");
    });

    await runner.step("Successfully logs in with valid credentials and renders Dashboard", async (page) => {
      await page.fill('input[type="email"]', "tester@lifeos.local");
      await page.fill('input[type="password"]', "Password123!");
      await page.click('button[type="submit"]');

      // Wait for dashboard to load
      await page.waitForSelector("aside", { timeout: 10000 });
      await page.waitForTimeout(1000);

      const homeLink = await page.$('a[title="Home"], a[href="/"]');
      assert.ok(homeLink, "Sidebar navigation should be present after login");
      await runner.screenshot("01_auth_login_success");

      // Save storage state for remaining tests
      await runner.context.storageState({ path: STORAGE_PATH });
    });

    await runner.step("Session persistence: reload keeps user logged in without AuthModal", async (page) => {
      await page.reload();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      const authModal = await page.$('form button[type="submit"]');
      const btnText = await authModal?.textContent();
      assert.ok(!btnText?.includes("Sign In to LifeOS"), "User should remain logged in after reload");
      await runner.screenshot("01_auth_session_persisted");
    });

  } finally {
    await runner.close();
  }

  return runner.results;
}
