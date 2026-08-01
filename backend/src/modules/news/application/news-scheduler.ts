import { logger } from "../../../shared/logger.js";
import type { createRssFetchService } from "./rss-fetch-service.js";

export function createNewsScheduler(rssFetchService: ReturnType<typeof createRssFetchService>) {
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let fetchIntervalMinutes = 60;
  let lastRun: string | undefined;
  let error: string | undefined;
  let running = false;

  return {
    start(intervalMinutes?: number): void {
      if (intervalId) {
        this.stop();
      }

      if (intervalMinutes) {
        fetchIntervalMinutes = intervalMinutes;
      }

      logger.info("Starting news scheduler", { intervalMinutes: fetchIntervalMinutes });

      this.runFetchCycle();

      intervalId = setInterval(
        () => {
          this.runFetchCycle();
        },
        fetchIntervalMinutes * 60 * 1000,
      );
    },

    stop(): void {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        logger.info("News scheduler stopped");
      }
    },

    setInterval(minutes: number): void {
      fetchIntervalMinutes = minutes;
      if (intervalId) {
        this.stop();
        this.start();
      }
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

    async runFetchCycle(): Promise<void> {
      if (running) return;
      running = true;
      try {
        logger.info("Running news fetch cycle");
        const result = await rssFetchService.fetchAllActiveFeeds();
        logger.info("News fetch cycle complete", {
          totalFeeds: result.totalFeeds,
          newArticles: result.totalNewArticles,
        });
        lastRun = new Date().toISOString();
        error = undefined;
      } catch (err) {
        logger.error("Error in news fetch cycle", { error: (err as Error).message });
        error = (err as Error).message;
        lastRun = new Date().toISOString();
      } finally {
        running = false;
      }
    },
  };
}
