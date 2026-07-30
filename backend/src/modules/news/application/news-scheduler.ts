import { logger } from "../../../shared/logger.js";
import type { createRssFetchService } from "./rss-fetch-service.js";

export function createNewsScheduler(rssFetchService: ReturnType<typeof createRssFetchService>) {
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let fetchIntervalMinutes = 60;

  return {
    start(intervalMinutes?: number): void {
      if (intervalId) {
        this.stop();
      }

      if (intervalMinutes) {
        fetchIntervalMinutes = intervalMinutes;
      }

      logger.info("Starting news scheduler", { intervalMinutes: fetchIntervalMinutes });

      // Run immediately on start
      this.runFetchCycle();

      // Then run on interval
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

    async runFetchCycle(): Promise<void> {
      try {
        logger.info("Running news fetch cycle");
        const result = await rssFetchService.fetchAllActiveFeeds();
        logger.info("News fetch cycle complete", {
          totalFeeds: result.totalFeeds,
          newArticles: result.totalNewArticles,
        });
      } catch (error) {
        logger.error("Error in news fetch cycle", { error: (error as Error).message });
      }
    },
  };
}
