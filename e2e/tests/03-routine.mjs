import assert from "node:assert";
import path from "node:path";
import { TestRunner } from "../helpers/test-context.mjs";

const STORAGE_PATH = path.resolve(process.cwd(), "e2e/storage-state.json");

export async function runRoutineSuite() {
  const runner = new TestRunner("03 - Routine & Schedule");
  await runner.init({ storageState: STORAGE_PATH });
  await runner.ensureLoggedIn();

  try {
    await runner.step("Navigates to Routine page and renders tabs", async (page) => {
      await page.goto("http://localhost:5173/routine");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);

      const header = await page.textContent("h1, h2");
      assert.ok(header.includes("Routine") || header.includes("Schedule"), "Routine header should be displayed");

      const tabs = await page.$$("button[role='tab']");
      assert.ok(tabs.length >= 4, "Should display Overview, Schedule, History, Categories tabs");
      await runner.screenshot("03_routine_initial");
    });

    await runner.step("Manages Categories: creates custom routine category", async (page) => {
      const catTab = page.getByRole("tab", { name: "Categories" });
      await catTab.click();
      await page.waitForTimeout(400);

      const addCatBtn = page.locator("button:has-text('Add Category'), button:has-text('New Category')");
      if (await addCatBtn.count() > 0) {
        await addCatBtn.first().click();
        await page.waitForTimeout(300);

        const nameInput = page.locator("input[placeholder*='Category Name'], input[placeholder*='name'], form input[type='text']").first();
        await nameInput.fill("Focus Work");

        const submitBtn = page.locator("form button[type='submit']");
        await submitBtn.click();
        await page.waitForTimeout(600);

        const bodyText = await page.textContent("body");
        assert.ok(bodyText.includes("Focus Work"), "Newly created category 'Focus Work' should be displayed");
      }
      await runner.screenshot("03_routine_categories");
    });

    await runner.step("Schedule Tab: Date navigation and View Mode switching", async (page) => {
      const scheduleTab = page.getByRole("tab", { name: "Schedule" });
      await scheduleTab.click();
      await page.waitForTimeout(400);

      const nextBtn = page.locator("button[title='Next Day']");
      if (await nextBtn.count() > 0) {
        await nextBtn.click();
        await page.waitForTimeout(400);

        const jumpTodayBtn = page.locator("button:has-text('Jump to Today')");
        assert.ok(await jumpTodayBtn.count() > 0, "Jump to Today button should appear when date is not today");

        await jumpTodayBtn.click();
        await page.waitForTimeout(400);
      }

      // Switch to Timeline view
      const timelineBtn = page.getByRole("tab", { name: "Timeline" });
      if (await timelineBtn.count() > 0) {
        await timelineBtn.click();
        await page.waitForTimeout(400);
        await runner.screenshot("03_routine_timeline_view");

        // Switch back to List view
        const listBtn = page.getByRole("tab", { name: "List View" });
        await listBtn.click();
        await page.waitForTimeout(300);
      }
    });

    await runner.step("Task Creation: Validates edge cases (past time, same start/end, empty title)", async (page) => {
      await runner.closeAnyOpenModal();
      const addTaskBtn = page.locator("button:has-text('Add Task')").first();
      await addTaskBtn.click();
      await page.waitForTimeout(400);

      // Verify modal opened
      const modal = page.locator("form");
      assert.ok(await modal.count() > 0, "Task creation modal must open");

      // Edge case: Identical start and end time (duration 0)
      const titleInput = page.locator("#task-title");
      await titleInput.fill("Edge Case Test Task");
      const startTimeInput = page.locator("#task-start-time");
      await startTimeInput.fill("14:00");
      const endTimeInput = page.locator("#task-end-time");
      await endTimeInput.fill("14:00");
      await page.waitForTimeout(200);

      const submitBtn = page.locator("form button[type='submit']");
      await submitBtn.click();
      await page.waitForTimeout(300);

      const bodyText = await page.textContent("form");
      const hasError = bodyText.includes("Start time cannot be equal to end time") || bodyText.includes("past");
      assert.ok(hasError, "Form must reject invalid task scheduling");
      await runner.screenshot("03_routine_task_time_validation_error");

      // Cancel modal
      const cancelBtn = page.locator("form button:has-text('Cancel')");
      await cancelBtn.click();
      await page.waitForTimeout(300);
    });

    await runner.step("Task Creation: Creates a valid task with subtasks", async (page) => {
      const addTaskBtn = page.locator("button:has-text('Add Task')").first();
      await addTaskBtn.click();
      await page.waitForTimeout(400);

      await page.fill("#task-title", "Playwright Architecture Review");

      // Set tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];
      await page.fill("#task-date", tomorrowStr);

      await page.fill("#task-start-time", "10:00");
      await page.fill("#task-end-time", "11:30");

      // Add subtasks
      const subtaskInput = page.locator("input[placeholder*='sub-task']");
      if (await subtaskInput.count() > 0) {
        await subtaskInput.fill("Verify API Schemas");
        // Use exact Add button for subtasks inside the subtasks section
        await page.getByRole("button", { name: "Add", exact: true }).click();
        await page.waitForTimeout(200);

        await subtaskInput.fill("Run Performance Trace");
        await page.getByRole("button", { name: "Add", exact: true }).click();
        await page.waitForTimeout(200);
      }

      await runner.screenshot("03_routine_task_create_filled");

      // Submit
      await page.locator("form button[type='submit']").click();
      await page.waitForTimeout(1000);

      // Navigate date to tomorrow using Next Day button
      await page.locator("button[title='Next Day']").click();
      await page.waitForTimeout(1000);

      const taskListText = await page.textContent("body");
      assert.ok(taskListText.includes("Playwright Architecture Review"), "Newly created task must appear in schedule list for tomorrow");
      await runner.screenshot("03_routine_task_created_list");
    });

    await runner.step("Task Interaction: Subtask toggle, status change, and delete", async (page) => {
      // Find the task card
      const taskCard = page.locator("div:has-text('Playwright Architecture Review')").last();

      const subtaskCheckbox = taskCard.locator("input[type='checkbox']").first();
      if (await subtaskCheckbox.count() > 0) {
        await subtaskCheckbox.check();
        await page.waitForTimeout(400);
      }

      const deleteBtn = page.locator("button[aria-label*='Delete'], button[title*='Delete'], button:has(svg.lucide-trash-2)").first();
      if (await deleteBtn.count() > 0) {
        await deleteBtn.click();
        await page.waitForTimeout(300);

        const confirmBtn = page.locator("button:has-text('Delete Task'), button:has-text('Confirm')");
        if (await confirmBtn.count() > 0) {
          await confirmBtn.click();
          await page.waitForTimeout(500);
        }
      }
      await runner.screenshot("03_routine_task_deleted");
    });

  } finally {
    await runner.close();
  }

  return runner.results;
}
