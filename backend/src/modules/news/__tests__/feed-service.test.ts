import { beforeEach, describe, expect, it } from "vitest";

import { createFeedService } from "../application/feed-service.js";
import type { NewRssFeedInput, RssFeed } from "../domain/types.js";
import type { RssFeedRepository } from "../ports/repositories.js";

function createMockFeedRepository(): RssFeedRepository {
  const feeds = new Map<string, RssFeed>();

  return {
    getById(id: string): RssFeed | undefined {
      return feeds.get(id);
    },
    getAll(): RssFeed[] {
      return Array.from(feeds.values());
    },
    getActive(): RssFeed[] {
      return Array.from(feeds.values()).filter((f) => f.status === "active");
    },
    getByUrl(url: string): RssFeed | undefined {
      return Array.from(feeds.values()).find((f) => f.url === url);
    },
    create(id: string, input: NewRssFeedInput): RssFeed {
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
    update(id: string, patch: Partial<NewRssFeedInput>): RssFeed | undefined {
      const feed = feeds.get(id);
      if (!feed) return undefined;
      const updated = { ...feed, ...patch, updatedAt: new Date().toISOString() };
      feeds.set(id, updated);
      return updated;
    },
    updateStatus(id: string, status: "active" | "inactive"): RssFeed | undefined {
      const feed = feeds.get(id);
      if (!feed) return undefined;
      const updated = { ...feed, status, updatedAt: new Date().toISOString() };
      feeds.set(id, updated);
      return updated;
    },
    updateFetchStatus(
      id: string,
      lastFetchedAt: string,
      lastFetchError?: string,
    ): RssFeed | undefined {
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
    delete(id: string): boolean {
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
    it("should create a new feed successfully", () => {
      const result = feedService.createFeed({
        title: "Test Feed",
        url: "https://example.com/feed.xml",
      });

      expect(result.success).toBe(true);
      expect(result.feed).toBeDefined();
      expect(result.feed?.title).toBe("Test Feed");
      expect(result.feed?.url).toBe("https://example.com/feed.xml");
      expect(result.feed?.status).toBe("active");
    });

    it("should fail when creating duplicate feed", () => {
      feedService.createFeed({
        title: "Test Feed",
        url: "https://example.com/feed.xml",
      });

      const result = feedService.createFeed({
        title: "Duplicate Feed",
        url: "https://example.com/feed.xml",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Feed already exists");
    });
  });

  describe("getAllFeeds", () => {
    it("should return all feeds", () => {
      feedService.createFeed({ title: "Feed 1", url: "https://example.com/feed1.xml" });
      feedService.createFeed({ title: "Feed 2", url: "https://example.com/feed2.xml" });

      const feeds = feedService.getAllFeeds();
      expect(feeds).toHaveLength(2);
    });

    it("should return empty array when no feeds exist", () => {
      const feeds = feedService.getAllFeeds();
      expect(feeds).toHaveLength(0);
    });
  });

  describe("deleteFeed", () => {
    it("should delete an existing feed", () => {
      const result = feedService.createFeed({
        title: "Test Feed",
        url: "https://example.com/feed.xml",
      });
      expect(result.feed).toBeDefined();
      const feedId = result.feed?.id as string;

      const deleteResult = feedService.deleteFeed(feedId);
      expect(deleteResult.success).toBe(true);

      const feeds = feedService.getAllFeeds();
      expect(feeds).toHaveLength(0);
    });

    it("should fail when deleting non-existent feed", () => {
      const result = feedService.deleteFeed("non-existent-id");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Feed not found");
    });
  });

  describe("toggleFeedStatus", () => {
    it("should toggle feed from active to inactive", () => {
      const result = feedService.createFeed({
        title: "Test Feed",
        url: "https://example.com/feed.xml",
      });
      expect(result.feed).toBeDefined();
      const feedId = result.feed?.id as string;

      const toggleResult = feedService.toggleFeedStatus(feedId);
      expect(toggleResult.success).toBe(true);
      expect(toggleResult.feed?.status).toBe("inactive");
    });

    it("should toggle feed from inactive to active", () => {
      const result = feedService.createFeed({
        title: "Test Feed",
        url: "https://example.com/feed.xml",
      });
      expect(result.feed).toBeDefined();
      const feedId = result.feed?.id as string;

      feedService.toggleFeedStatus(feedId);
      const toggleResult = feedService.toggleFeedStatus(feedId);
      expect(toggleResult.success).toBe(true);
      expect(toggleResult.feed?.status).toBe("active");
    });
  });
});
