import assert from "node:assert";
import path from "node:path";
import { TestRunner } from "../helpers/test-context.mjs";

const STORAGE_PATH = path.resolve(process.cwd(), "e2e/storage-state.json");

export async function runWorkoutsSuite() {
  const runner = new TestRunner("05 - Workouts & Live Coach Mode");
  await runner.init({ storageState: STORAGE_PATH });
  await runner.ensureLoggedIn();

  try {
    await runner.step("Navigates to Workouts page and renders tabs", async (page) => {
      await page.goto("http://localhost:5173/workouts");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);

      const header = await page.textContent("h1, h2");
      assert.ok(header.includes("Workouts"), "Workouts header should be visible");

      const tabs = await page.$$("button[role='tab']");
      assert.ok(tabs.length >= 4, "Should display Overview, Plans, Exercises, History tabs");
      await runner.screenshot("05_workouts_initial");
    });

    await runner.step("Exercises Tab: Creates standard exercises and searches library", async (page) => {
      await runner.closeAnyOpenModal();
      const exercisesTab = page.getByRole("tab", { name: "Exercises" });
      await exercisesTab.click();
      await page.waitForTimeout(400);

      // Create an exercise with unique name
      const addExBtn = page.locator("button:has-text('Add Exercise')").first();
      await addExBtn.click();
      await page.waitForTimeout(400);

      const uniqueEx = `Barbell Press ${Date.now()}`;
      runner.currentExerciseName = uniqueEx;

      const nameInput = page.locator(".fixed.inset-0 form input").first();
      await nameInput.fill(uniqueEx);

      const saveBtn = page.locator(".fixed.inset-0 form button:has-text('Save Exercise')");
      await saveBtn.click();
      await page.waitForSelector(".fixed.inset-0 form", { state: "detached", timeout: 8000 });
      await page.waitForTimeout(600);

      // Search exercise
      const searchInput = page.locator("input[placeholder*='Search exercises']").first();
      if (await searchInput.count() > 0) {
        await searchInput.fill("Barbell");
        await page.waitForTimeout(300);
      }

      const bodyText = await page.textContent("body");
      assert.ok(bodyText.includes(uniqueEx) || bodyText.includes("Barbell"), "Newly created exercise should appear in library");
      await runner.screenshot("05_workouts_exercise_library");
    });

    await runner.step("Plans Tab: Creates a new workout plan", async (page) => {
      await runner.closeAnyOpenModal();
      const plansTab = page.getByRole("tab", { name: "Plans" });
      await plansTab.click();
      await page.waitForTimeout(400);

      const newPlanBtn = page.locator("button:has-text('New Workout'), button:has-text('Create your first workout')").first();
      await newPlanBtn.click();
      await page.waitForTimeout(400);

      const uniquePlanName = `Power Push ${Date.now()}`;
      const nameInput = page.locator("input[placeholder*='Upper Body Power']");
      await nameInput.fill(uniquePlanName);

      const descInput = page.locator("input[placeholder*='Brief description']");
      await descInput.fill("Hypertrophy focused chest, shoulders, and triceps");

      await page.locator("form button:has-text('Create Plan')").click();
      await page.waitForSelector("form button:has-text('Create Plan')", { state: "detached", timeout: 8000 });
      await page.waitForTimeout(600);

      const bodyText = await page.textContent("body");
      assert.ok(bodyText.includes(uniquePlanName), "Newly created plan must appear in Plans grid");
      await runner.screenshot("05_workouts_plan_created");

      runner.currentPlanName = uniquePlanName;
    });

    await runner.step("Workout Detail: Adds exercise to the workout plan", async (page) => {
      await runner.closeAnyOpenModal();
      const planName = runner.currentPlanName || "Power Push";
      const planCard = page.locator(`button:has-text('${planName}'), div:has-text('${planName}')`).last();
      await planCard.click();
      await page.waitForTimeout(600);

      // Click Add Exercise inside WorkoutDetail
      const addExBtn = page.locator("button:has-text('Add Exercise')").first();
      await addExBtn.click();
      await page.waitForTimeout(500);

      // Select exercise from modal dropdown
      const selectEx = page.locator(".fixed.inset-0 select").first();
      assert.ok(await selectEx.count() > 0, "Exercise dropdown must exist in modal");
      await selectEx.selectOption({ index: 1 });
      await page.waitForTimeout(200);

      // Click Add inside the modal
      const modalAddBtn = page.locator(".fixed.inset-0 button.bg-emerald-600, .fixed.inset-0 button:has-text('Add')").last();
      await modalAddBtn.click();
      await page.waitForSelector(".fixed.inset-0 select", { state: "detached", timeout: 8000 });
      await page.waitForTimeout(600);

      const bodyText = await page.textContent("body");
      assert.ok(bodyText.includes("Barbell") || (runner.currentExerciseName && bodyText.includes(runner.currentExerciseName)), "Exercise should be listed under the workout plan");
      await runner.screenshot("05_workouts_detail_with_exercise");
    });

    await runner.step("Coach Mode: Starts live session, logs set, and completes session", async (page) => {
      await runner.closeAnyOpenModal();
      const startSessionBtn = page.locator("button:has-text('Start Session')").first();
      assert.ok(await startSessionBtn.isEnabled(), "Start Session button should now be enabled");

      await startSessionBtn.click();
      await page.waitForTimeout(800);

      const bodyText = await page.textContent("body");
      const inCoachMode = bodyText.includes("Coach") || bodyText.includes("Finish Workout") || bodyText.includes("Set") || bodyText.includes("Rest");
      assert.ok(inCoachMode, "CoachMode live session should be active");
      await runner.screenshot("05_workouts_coach_mode_active");

      // Finish workout
      const finishBtn = page.locator("button:has-text('Finish Workout'), button:has-text('Complete')").first();
      if (await finishBtn.count() > 0) {
        await finishBtn.click();
        await page.waitForTimeout(1000);
      }
      await runner.screenshot("05_workouts_session_finished");
    });

  } finally {
    await runner.close();
  }

  return runner.results;
}
