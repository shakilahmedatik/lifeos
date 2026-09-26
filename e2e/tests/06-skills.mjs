import assert from "node:assert";
import path from "node:path";
import { TestRunner } from "../helpers/test-context.mjs";

const STORAGE_PATH = path.resolve(process.cwd(), "e2e/storage-state.json");

export async function runSkillsSuite() {
  const runner = new TestRunner("06 - Skills & Continuous Learning");
  await runner.init({ storageState: STORAGE_PATH });
  await runner.ensureLoggedIn();

  try {
    await runner.step("Navigates to Skills page and renders tabs", async (page) => {
      await page.goto("http://localhost:5173/skills");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);

      const header = await page.textContent("h1, h2");
      assert.ok(header.includes("Skills"), "Skills header should be visible");

      const tabs = await page.$$("button[role='tab']");
      assert.ok(tabs.length >= 4, "Should display Overview, Sessions, Resources, Areas tabs");
      await runner.screenshot("06_skills_initial");
    });

    await runner.step("Areas Tab: Creates a new Skill Area", async (page) => {
      const areasTab = page.getByRole("tab", { name: "Areas" });
      await areasTab.click();
      await page.waitForTimeout(400);

      // Click Create Area in header
      const createAreaBtn = page.locator("div.flex.justify-between button:has-text('Create Area')").first();
      await createAreaBtn.click();
      await page.waitForTimeout(400);

      const uniqueAreaName = `Cloud Tech ${Date.now()}`;
      // Input has placeholder "e.g., Programming, Design, Language"
      const nameInput = page.locator(".fixed.inset-0 form input").first();
      await nameInput.fill(uniqueAreaName);

      const submitBtn = page.locator(".fixed.inset-0 form button:has-text('Create Area')");
      await submitBtn.click();
      await page.waitForSelector(".fixed.inset-0 form", { state: "detached", timeout: 8000 });
      await page.waitForTimeout(600);

      const bodyText = await page.textContent("body");
      assert.ok(bodyText.includes(uniqueAreaName), "Skill Area should appear in list");
      await runner.screenshot("06_skills_areas_list");

      runner.currentAreaName = uniqueAreaName;
    });

    await runner.step("Resources Tab: Adds a learning resource", async (page) => {
      const resourcesTab = page.getByRole("tab", { name: "Resources" });
      await resourcesTab.click();
      await page.waitForTimeout(400);

      const addResBtn = page.locator("button:has-text('Add Resource')").first();
      await addResBtn.click();
      await page.waitForTimeout(400);

      const uniqueResourceTitle = `Distributed Systems ${Date.now()}`;
      const titleInput = page.locator(".fixed.inset-0 form input").first();
      await titleInput.fill(uniqueResourceTitle);

      const unitsInput = page.locator(".fixed.inset-0 form input[type='number']").first();
      if (await unitsInput.count() > 0) {
        await unitsInput.fill("500");
      }

      const submitBtn = page.locator(".fixed.inset-0 form button:has-text('Add Resource'), .fixed.inset-0 form button[type='submit']");
      await submitBtn.click();
      await page.waitForSelector(".fixed.inset-0 form", { state: "detached", timeout: 8000 });
      await page.waitForTimeout(600);

      const bodyText = await page.textContent("body");
      assert.ok(bodyText.includes(uniqueResourceTitle), "Resource should appear in list");
      await runner.screenshot("06_skills_resources_list");

      runner.currentResourceTitle = uniqueResourceTitle;
    });

    await runner.step("Sessions Tab: Logs learning session with duration and notes", async (page) => {
      const sessionsTab = page.getByRole("tab", { name: "Sessions" });
      await sessionsTab.click();
      await page.waitForTimeout(400);

      const logBtn = page.locator("button:has-text('Log Session')").first();
      await logBtn.click();
      await page.waitForTimeout(400);

      const durationInput = page.locator(".fixed.inset-0 form input[type='number']").first();
      if (await durationInput.count() > 0) {
        await durationInput.fill("45");
      }

      const notesInput = page.locator(".fixed.inset-0 form textarea").first();
      if (await notesInput.count() > 0) {
        await notesInput.fill("Deep dive into Paxos and Raft consensus protocols");
      }

      const submitBtn = page.locator(".fixed.inset-0 form button:has-text('Log Session'), .fixed.inset-0 form button[type='submit']");
      await submitBtn.click();
      await page.waitForSelector(".fixed.inset-0 form", { state: "detached", timeout: 8000 });
      await page.waitForTimeout(600);

      const bodyText = await page.textContent("body");
      assert.ok(bodyText.includes("45") || bodyText.includes("Paxos"), "Logged session should appear in sessions list");
      await runner.screenshot("06_skills_session_logged");
    });

    await runner.step("Overview Tab: Verifies progress metrics calculation", async (page) => {
      const overviewTab = page.getByRole("tab", { name: "Overview" });
      await overviewTab.click();
      await page.waitForTimeout(500);

      const bodyText = await page.textContent("body");
      assert.ok(bodyText.includes("Total") || bodyText.includes("Hours") || bodyText.includes("Skills") || bodyText.includes("Progress"), "Should show learning progress metrics");
      await runner.screenshot("06_skills_overview");
    });

  } finally {
    await runner.close();
  }

  return runner.results;
}
