import { beforeEach, describe, expect, it } from "vitest";

import { createFeedService } from "../application/feed-service.js";
import type { NewRssFeedInput, RssFeed } from "../domain/types.js";
import type { RssFeedRepository } from "../ports/repositories.js";

function createMockFeedRepository(): RssFeedRepository {
  const feeds = new Map<string, RssFeed>();

  return {
    async getById(id: string): Promise<RssFeed | undefined> {
      return feeds.get(id);
    },
    async getAll(): Promise<RssFeed[]> {
      return Array.from(feeds.values());
    },
    async getActive(): Promise<RssFeed[]> {
      return Array.from(feeds.values()).filter((f) => f.status === "active");
    },
    async getByUrl(url: string): Promise<RssFeed | undefined> {
      return Array.from(feeds.values()).find((f) => f.url === url);
    },
    async create(id: string, input: NewRssFeedInput): Promise<RssFeed> {
      const feed: RssFeed = {
        id,
        title: input.title,
        url: input.url,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      feeds.set(id, feed);
      return feed;
    },
    async update(id: string, patch: Partial<NewRssFeedInput>): Promise<RssFeed | undefined> {
      const feed = feeds.get(id);
      if (!feed) return undefined;
      const updated = { ...feed, ...patch, updatedAt: new Date().toISOString() };
      feeds.set(id, updated);
      return updated;
    },
    async updateStatus(id: string, status: "active" | "inactive"): Promise<RssFeed | undefined> {
      const feed = feeds.get(id);
      if (!feed) return undefined;
      const updated = { ...feed, status, updatedAt: new Date().toISOString() };
      feeds.set(id, updated);
      return updated;
    },
    async updateFetchStatus(
      id: string,
      lastFetchedAt: string,
      lastFetchError?: string,
    ): Promise<RssFeed | undefined> {
      const feed = feeds.get(id);
      if (!feed) return undefined;
      const updated = {
        ...feed,
        lastFetchedAt,
        lastFetchError,
        updatedAt: new Date().toISOString(),
      };
      feeds.set(id, updated);
      return updated;
    },
    async delete(id: string): Promise<boolean> {
      return feeds.delete(id);
    },
  };
}

describe("FeedService", () => {
  let feedService: ReturnType<typeof createFeedService>;
  let mockRepo: RssFeedRepository;

  beforeEach(() => {
    mockRepo = createMockFeedRepository();
    feedService = createFeedService(mockRepo);
  });

  describe("createFeed", () => {
    it("should create a new feed successfully", async () => {
      const result = await feedService.createFeed({
        title: "Test Feed",
        url: "https://example.com/feed.xml",
      });

      expect(result.success).toBe(true);
      expect(result.feed).toBeDefined();
      expect(result.feed?.title).toBe("Test Feed");
      expect(result.feed?.url).toBe("https://example.com/feed.xml");
      expect(result.feed?.status).toBe("active");
    });

    it("should fail when creating duplicate feed", async () => {
      await feedService.createFeed({
        title: "Test Feed",
        url: "https://example.com/feed.xml",
      });

      const result = await feedService.createFeed({
        title: "Duplicate Feed",
        url: "https://example.com/feed.xml",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Feed already exists");
    });
  });

  describe("getAllFeeds", () => {
    it("should return all feeds", async () => {
      await feedService.createFeed({ title: "Feed 1", url: "https://example.com/feed1.xml" });
      await feedService.createFeed({ title: "Feed 2", url: "https://example.com/feed2.xml" });

      const feeds = await feedService.getAllFeeds();
      expect(feeds).toHaveLength(2);
    });

    it("should return empty array when no feeds exist", async () => {
      const feeds = await feedService.getAllFeeds();
      expect(feeds).toHaveLength(0);
    });
  });

  describe("deleteFeed", () => {
    it("should delete an existing feed", async () => {
      const result = await feedService.createFeed({
        title: "Test Feed",
        url: "https://example.com/feed.xml",
      });
      expect(result.feed).toBeDefined();
      const feedId = result.feed?.id as string;

      const deleteResult = await feedService.deleteFeed(feedId);
      expect(deleteResult.success).toBe(true);

      const feeds = await feedService.getAllFeeds();
      expect(feeds).toHaveLength(0);
    });

    it("should fail when deleting non-existent feed", async () => {
      const result = await feedService.deleteFeed("non-existent-id");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Feed not found");
    });
  });

  describe("toggleFeedStatus", () => {
    it("should toggle feed from active to inactive", async () => {
      const result = await feedService.createFeed({
        title: "Test Feed",
        url: "https://example.com/feed.xml",
      });
      expect(result.feed).toBeDefined();
      const feedId = result.feed?.id as string;

      const toggleResult = await feedService.toggleFeedStatus(feedId);
      expect(toggleResult.success).toBe(true);
      expect(toggleResult.feed?.status).toBe("inactive");
    });

    it("should toggle feed from inactive to active", async () => {
      const result = await feedService.createFeed({
        title: "Test Feed",
        url: "https://example.com/feed.xml",
      });
      expect(result.feed).toBeDefined();
      const feedId = result.feed?.id as string;

      await feedService.toggleFeedStatus(feedId);
      const toggleResult = await feedService.toggleFeedStatus(feedId);
      expect(toggleResult.success).toBe(true);
      expect(toggleResult.feed?.status).toBe("active");
    });
  });
});
