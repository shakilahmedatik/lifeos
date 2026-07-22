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

      console.log(`Starting news scheduler with ${fetchIntervalMinutes} minute interval`);

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
        console.log("News scheduler stopped");
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
        console.log("Running news fetch cycle...");
        const result = await rssFetchService.fetchAllActiveFeeds();
        console.log(
          `Fetch cycle complete: ${result.totalFeeds} feeds checked, ${result.totalNewArticles} new articles`,
        );
      } catch (error) {
        console.error("Error in fetch cycle:", error);
      }
    },
  };
}
