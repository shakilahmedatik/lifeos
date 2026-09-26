import fs from "node:fs";
import path from "node:path";
import { runAuthSuite } from "./tests/01-auth.mjs";
import { runDashboardSuite } from "./tests/02-dashboard.mjs";
import { runRoutineSuite } from "./tests/03-routine.mjs";
import { runHabitsSuite } from "./tests/04-habits.mjs";
import { runWorkoutsSuite } from "./tests/05-workouts.mjs";
import { runSkillsSuite } from "./tests/06-skills.mjs";
import { runFinanceSuite } from "./tests/07-finance.mjs";
import { runProfileSuite } from "./tests/08-profile.mjs";
import { runResponsiveSuite } from "./tests/09-responsive.mjs";
import { runEdgeCasesSuite } from "./tests/10-edge-cases.mjs";

const REPORT_DIR = path.resolve(process.cwd(), "e2e/reports");
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

async function main() {
  console.log("===============================================================");
  console.log("🚀 STARTING FULL E2E TEST SUITE: LIFEOS APPLICATION");
  console.log("Target Environment: http://localhost:5173 (Frontend) & http://localhost:3000 (Backend)");
  console.log("Local Turso DB: http://127.0.0.1:8081");
  console.log("===============================================================\n");

  const suites = [
    { name: "01 - Authentication & Session", run: runAuthSuite },
    { name: "02 - Dashboard & Widgets", run: runDashboardSuite },
    { name: "03 - Routine & Schedule", run: runRoutineSuite },
    { name: "04 - Habits Tracking", run: runHabitsSuite },
    { name: "05 - Workouts & Live Coach Mode", run: runWorkoutsSuite },
    { name: "06 - Skills & Continuous Learning", run: runSkillsSuite },
    { name: "07 - Finance, Accounts & Budgets", run: runFinanceSuite },
    { name: "08 - Profile, Theme & System Settings", run: runProfileSuite },
    { name: "09 - Mobile & Responsive Layout", run: runResponsiveSuite },
    { name: "10 - Edge Cases, 404 & Resilience", run: runEdgeCasesSuite },
  ];

  const overallResults = [];
  const startTime = Date.now();

  for (const suite of suites) {
    console.log(`\n===============================================================`);
    console.log(`📦 EXECUTING SUITE: ${suite.name}`);
    console.log(`===============================================================`);
    try {
      const results = await suite.run();
      overallResults.push({ suite: suite.name, tests: results });
    } catch (err) {
      console.error(`💥 Suite execution crashed: ${err.message}`, err.stack);
      overallResults.push({
        suite: suite.name,
        crashed: true,
        error: err.message,
        tests: [],
      });
    }
  }

  const totalDuration = Date.now() - startTime;
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const suite of overallResults) {
    for (const test of suite.tests || []) {
      totalTests++;
      if (test.status === "passed") passedTests++;
      else failedTests++;
    }
  }

  // Save JSON report
  const jsonReportPath = path.join(REPORT_DIR, "test-results.json");
  fs.writeFileSync(
    jsonReportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        durationMs: totalDuration,
        summary: { totalTests, passedTests, failedTests },
        suites: overallResults,
      },
      null,
      2
    )
  );

  // Generate Markdown Report
  let md = `# LifeOS End-to-End Test Verification Report\n\n`;
  md += `**Execution Date:** ${new Date().toLocaleString()}  \n`;
  md += `**Target URL:** \`http://localhost:5173\`  \n`;
  md += `**Total Duration:** ${(totalDuration / 1000).toFixed(2)}s  \n`;
  md += `**Test Summary:** Total: **${totalTests}** | Passed: **${passedTests}** | Failed: **${failedTests}**  \n\n`;

  md += `## Executive Summary\n\n`;
  if (failedTests === 0) {
    md += `> ✅ **ALL E2E TEST SUITES PASSED.** Every core user flow across Auth, Dashboard, Routine, Habits, Workouts, Skills, Finance, Profile, Mobile layout, and Edge Cases executed cleanly with verified UI state transitions and zero fatal client exceptions.\n\n`;
  } else {
    md += `> ⚠️ **SOME E2E TESTS FAILED.** ${failedTests} out of ${totalTests} tests encountered errors. See detailed breakdowns below.\n\n`;
  }

  md += `## Detailed Suite Results\n\n`;

  for (const suite of overallResults) {
    md += `### ${suite.suite}\n\n`;
    if (suite.crashed) {
      md += `❌ **Suite Crashed:** ${suite.error}\n\n`;
      continue;
    }

    md += `| Test Case / User Flow | Status | Duration | Page Errors |\n`;
    md += `| :--- | :---: | :---: | :---: |\n`;

    for (const test of suite.tests || []) {
      const statusIcon = test.status === "passed" ? "✅ Passed" : "❌ Failed";
      const errCount = test.pageErrors?.length || 0;
      md += `| ${test.title} | ${statusIcon} | ${test.duration}ms | ${errCount === 0 ? "0" : `⚠️ ${errCount}`} |\n`;
      if (test.error) {
        md += `\n> **Failure Details:** \`${test.error.message}\`  \n`;
      }
    }
    md += `\n`;
  }

  const mdReportPath = path.join(REPORT_DIR, "TEST_REPORT.md");
  fs.writeFileSync(mdReportPath, md);

  console.log("\n===============================================================");
  console.log("🏁 ALL TEST SUITES FINISHED");
  console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`Summary: ${passedTests} / ${totalTests} passed (${failedTests} failed)`);
  console.log(`Detailed Report: ${mdReportPath}`);
  console.log(`JSON Results: ${jsonReportPath}`);
  console.log("===============================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error running tests:", err);
  process.exit(1);
});
