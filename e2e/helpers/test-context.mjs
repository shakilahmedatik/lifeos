import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";
const SCREENSHOT_DIR = path.resolve(process.cwd(), "e2e/screenshots");
const STORAGE_PATH = path.resolve(process.cwd(), "e2e/storage-state.json");

export class TestRunner {
  constructor(suiteName) {
    this.suiteName = suiteName;
    this.results = [];
    this.browser = null;
    this.context = null;
    this.page = null;
    this.consoleLogs = [];
    this.pageErrors = [];
    this.networkErrors = [];
  }

  async init(options = {}) {
    this.browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const contextOptions = {
      viewport: options.viewport || { width: 1280, height: 800 },
      ...options.contextOptions,
    };

    if (options.storageState && fs.existsSync(options.storageState)) {
      contextOptions.storageState = options.storageState;
    }

    this.context = await this.browser.newContext(contextOptions);
    this.page = await this.context.newPage();

    this.consoleLogs = [];
    this.pageErrors = [];
    this.networkErrors = [];

    this.page.on("console", (msg) => {
      const entry = {
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
        time: new Date().toISOString(),
      };
      this.consoleLogs.push(entry);
    });

    this.page.on("pageerror", (err) => {
      this.pageErrors.push({
        message: err.message,
        stack: err.stack,
        time: new Date().toISOString(),
      });
    });

    this.page.on("requestfailed", (req) => {
      this.networkErrors.push({
        url: req.url(),
        failure: req.failure()?.errorText || "Unknown failure",
        method: req.method(),
        time: new Date().toISOString(),
      });
    });

    return { browser: this.browser, context: this.context, page: this.page };
  }

  async close() {
    if (this.context) await this.context.close().catch(() => {});
    if (this.browser) await this.browser.close().catch(() => {});
  }

  async screenshot(name) {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
    const cleanName = name.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filePath = path.join(SCREENSHOT_DIR, `${cleanName}.png`);
    await this.page.screenshot({ path: filePath, fullPage: false });
    return filePath;
  }

  async step(title, fn) {
    const startTime = Date.now();
    console.log(`\n▶ [${this.suiteName}] Running: ${title}`);
    const stepErrors = [];
    const initialErrorCount = this.pageErrors.length;

    try {
      await fn(this.page, this);
      const duration = Date.now() - startTime;
      const newErrors = this.pageErrors.slice(initialErrorCount);

      if (newErrors.length > 0) {
        console.warn(`  ⚠️ Step passed with ${newErrors.length} uncaught page error(s)`);
      }

      console.log(`  ✓ Passed (${duration}ms)`);
      this.results.push({
        title,
        status: "passed",
        duration,
        pageErrors: newErrors,
        error: null,
      });
      return true;
    } catch (err) {
      const duration = Date.now() - startTime;
      const screenPath = await this.screenshot(`FAIL_${title}`).catch(() => null);
      console.error(`  ✖ Failed: ${err.message}`);
      this.results.push({
        title,
        status: "failed",
        duration,
        pageErrors: this.pageErrors.slice(initialErrorCount),
        error: {
          message: err.message,
          stack: err.stack,
        },
        screenshot: screenPath,
      });
      return false;
    }
  }

  async login(email = "tester@lifeos.local", password = "Password123!") {
    await this.page.goto(BASE_URL);
    await this.page.waitForLoadState("domcontentloaded");

    const authForm = await this.page.$("form");
    if (!authForm) {
      return true;
    }

    const emailInput = await this.page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await emailInput.fill(email);

    const passInput = await this.page.waitForSelector('input[type="password"]', { timeout: 5000 });
    await passInput.fill(password);

    const submitBtn = await this.page.waitForSelector('button[type="submit"]');
    await submitBtn.click();

    await this.page.waitForSelector("aside:visible, nav:visible", { timeout: 8000 });
    await this.page.waitForTimeout(500);
    await this.context.storageState({ path: STORAGE_PATH });
    return true;
  }

  async ensureLoggedIn(email = "tester@lifeos.local", password = "Password123!") {
    await this.page.goto(BASE_URL);
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForTimeout(500);

    const authHeading = await this.page.$("h2:has-text('LifeOS')");
    const authSubmit = await this.page.$('form button[type="submit"]');
    const submitText = await authSubmit?.textContent();

    if (authHeading && authSubmit && submitText?.includes("LifeOS")) {
      if (submitText.includes("Create")) {
        const signInTab = this.page.locator(".grid button:has-text('Sign In')").first();
        if (await signInTab.count() > 0) {
          await signInTab.click();
          await this.page.waitForTimeout(200);
        }
      }

      const emailInput = await this.page.waitForSelector('input[type="email"]');
      await emailInput.fill(email);

      const passInput = await this.page.waitForSelector('input[type="password"]');
      await passInput.fill(password);

      const submitBtn = await this.page.waitForSelector('button[type="submit"]');
      await submitBtn.click();

      await this.page.waitForSelector("aside:visible, nav:visible", { timeout: 8000 });
      await this.page.waitForTimeout(500);
      await this.context.storageState({ path: STORAGE_PATH });
    }
  }

  async closeAnyOpenModal() {
    try {
      const cancelBtn = this.page.locator("button:has-text('Cancel'), button[aria-label='Close modal'], button[aria-label='Close']");
      if (await cancelBtn.count() > 0 && await cancelBtn.first().isVisible()) {
        await cancelBtn.first().click();
        await this.page.waitForTimeout(300);
      }
    } catch {}
  }
}
