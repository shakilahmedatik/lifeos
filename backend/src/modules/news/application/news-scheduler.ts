import { logger } from "../../../shared/logger.js";
import type { createRssFetchService } from "./rss-fetch-service.js";

export function createNewsScheduler(rssFetchService: ReturnType<typeof createRssFetchService>) {
  let fetchIntervalMinutes = 60;
  let lastRun: string | undefined;
  let lastRunTimestamp = 0;
  let error: string | undefined;
  let running = false;
  let _active = false;

  return {
    start(intervalMinutes?: number): void {
      _active = true;
      if (intervalMinutes) {
        fetchIntervalMinutes = intervalMinutes;
      }
      logger.info("News scheduler enabled (lazy request-driven execution)", {
        intervalMinutes: fetchIntervalMinutes,
      });
      // Trigger lazy cycle immediately if needed
      this.runFetchCycleIfNeeded();
    },

    stop(): void {
      _active = false;
      logger.info("News scheduler disabled");
    },

    setInterval(minutes: number): void {
      fetchIntervalMinutes = minutes;
    },

    getInterval(): number {
      return fetchIntervalMinutes;
    },

    getStatus(): {
      name: string;
      status: "idle" | "running" | "error";
      lastRun?: string;
      error?: string;
    } {
      return {
        name: "news",
        status: running ? "running" : error ? "error" : "idle",
        lastRun,
        error,
      };
    },

    async runFetchCycleIfNeeded(): Promise<void> {
      if (!_active) return;
      const now = Date.now();
      const intervalMs = fetchIntervalMinutes * 60 * 1000;
      if (running || (lastRunTimestamp > 0 && now - lastRunTimestamp < intervalMs)) {
        return;
      }
      await this.runFetchCycle();
    },

    async runFetchCycle(): Promise<void> {
      if (!_active || running) return;
      running = true;
      try {
        logger.info("Running news fetch cycle");
        const result = await rssFetchService.fetchAllActiveFeeds();
        logger.info("News fetch cycle complete", {
          totalFeeds: result.totalFeeds,
          newArticles: result.totalNewArticles,
        });
        lastRunTimestamp = Date.now();
        lastRun = new Date(lastRunTimestamp).toISOString();
        error = undefined;
      } catch (err) {
        logger.error("Error in news fetch cycle", { error: (err as Error).message });
        error = (err as Error).message;
        lastRunTimestamp = Date.now();
        lastRun = new Date(lastRunTimestamp).toISOString();
      } finally {
        running = false;
      }
    },
  };
}
