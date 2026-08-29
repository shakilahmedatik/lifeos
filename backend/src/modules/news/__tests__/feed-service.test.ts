import { beforeEach, describe, expect, it } from "vitest";

import { createFeedService } from "../application/feed-service.js";
import type { NewRssFeedInput, RssFeed } from "../domain/types.js";
import type { RssFeedRepository } from "../ports/repositories.js";

function createMockFeedRepository(): RssFeedRepository {
  const feeds = new Map<string, RssFeed>();

  return {
    async getById(id: string, userId?: string): Promise<RssFeed | undefined> {
      const feed = feeds.get(id);
      if (!feed) return undefined;
      if (userId && feed.userId && feed.userId !== userId && userId !== "default") {
        return undefined;
      }
      return feed;
    },
    async getAll(userId?: string): Promise<RssFeed[]> {
      const all = Array.from(feeds.values());
      if (!userId || userId === "default") return all;
      return all.filter((f) => f.userId === userId || !f.userId);
    },
    async getActive(userId?: string): Promise<RssFeed[]> {
      const all = Array.from(feeds.values()).filter((f) => f.status === "active");
      if (!userId || userId === "default") return all;
      return all.filter((f) => f.userId === userId || !f.userId);
    },
    async getAllActiveAcrossUsers(): Promise<RssFeed[]> {
      return Array.from(feeds.values()).filter((f) => f.status === "active");
    },
    async getByUrl(url: string, userId?: string): Promise<RssFeed | undefined> {
      return Array.from(feeds.values()).find((f) => {
        if (f.url !== url) return false;
        if (!userId || userId === "default") return true;
        return f.userId === userId || !f.userId;
      });
    },
    async create(id: string, input: NewRssFeedInput, userId?: string): Promise<RssFeed> {
      const feed: RssFeed = {
        id,
        userId: userId || "default",
        title: input.title,
        url: input.url,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      feeds.set(id, feed);
      return feed;
    },
    async update(
      id: string,
      patch: Partial<NewRssFeedInput>,
      userId?: string,
    ): Promise<RssFeed | undefined> {
      const feed = await this.getById(id, userId);
      if (!feed) return undefined;
      const updated = { ...feed, ...patch, updatedAt: new Date().toISOString() };
      feeds.set(id, updated);
      return updated;
    },
    async updateStatus(
      id: string,
      status: "active" | "inactive",
      userId?: string,
    ): Promise<RssFeed | undefined> {
      const feed = await this.getById(id, userId);
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
    async delete(id: string, userId?: string): Promise<boolean> {
      const feed = await this.getById(id, userId);
      if (!feed) return false;
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
      const result = await feedService.createFeed(
        {
          title: "Test Feed",
          url: "https://example.com/feed.xml",
        },
        "user-1",
      );

      expect(result.success).toBe(true);
      expect(result.feed).toBeDefined();
      expect(result.feed?.title).toBe("Test Feed");
      expect(result.feed?.url).toBe("https://example.com/feed.xml");
      expect(result.feed?.status).toBe("active");
      expect(result.feed?.userId).toBe("user-1");
    });

    it("should fail when creating duplicate feed for same user", async () => {
      await feedService.createFeed(
        {
          title: "Test Feed",
          url: "https://example.com/feed.xml",
        },
        "user-1",
      );

      const result = await feedService.createFeed(
        {
          title: "Duplicate Feed",
          url: "https://example.com/feed.xml",
        },
        "user-1",
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Feed already exists");
    });

    it("should allow different users to subscribe to the same feed URL", async () => {
      const user1Result = await feedService.createFeed(
        {
          title: "User 1 Feed",
          url: "https://example.com/feed.xml",
        },
        "user-1",
      );

      const user2Result = await feedService.createFeed(
        {
          title: "User 2 Feed",
          url: "https://example.com/feed.xml",
        },
        "user-2",
      );

      expect(user1Result.success).toBe(true);
      expect(user2Result.success).toBe(true);
      expect(user1Result.feed?.id).not.toBe(user2Result.feed?.id);

      const user1Feeds = await feedService.getAllFeeds("user-1");
      const user2Feeds = await feedService.getAllFeeds("user-2");

      expect(user1Feeds).toHaveLength(1);
      expect(user2Feeds).toHaveLength(1);
      expect(user1Feeds[0].id).toBe(user1Result.feed?.id);
      expect(user2Feeds[0].id).toBe(user2Result.feed?.id);
    });
  });

  describe("getAllFeeds", () => {
    it("should return only user's feeds", async () => {
      await feedService.createFeed(
        { title: "Feed 1", url: "https://example.com/feed1.xml" },
        "user-1",
      );
      await feedService.createFeed(
        { title: "Feed 2", url: "https://example.com/feed2.xml" },
        "user-2",
      );

      const feedsUser1 = await feedService.getAllFeeds("user-1");
      expect(feedsUser1).toHaveLength(1);
      expect(feedsUser1[0].title).toBe("Feed 1");

      const feedsUser2 = await feedService.getAllFeeds("user-2");
      expect(feedsUser2).toHaveLength(1);
      expect(feedsUser2[0].title).toBe("Feed 2");
    });

    it("should return empty array when no feeds exist for user", async () => {
      const feeds = await feedService.getAllFeeds("user-empty");
      expect(feeds).toHaveLength(0);
    });
  });

  describe("deleteFeed", () => {
    it("should delete an existing feed for owner", async () => {
      const result = await feedService.createFeed(
        {
          title: "Test Feed",
          url: "https://example.com/feed.xml",
        },
        "user-1",
      );
      expect(result.feed).toBeDefined();
      const feedId = result.feed?.id as string;

      const deleteResult = await feedService.deleteFeed(feedId, "user-1");
      expect(deleteResult.success).toBe(true);

      const feeds = await feedService.getAllFeeds("user-1");
      expect(feeds).toHaveLength(0);
    });

    it("should prevent User 2 from deleting User 1's feed", async () => {
      const result = await feedService.createFeed(
        {
          title: "Test Feed",
          url: "https://example.com/feed.xml",
        },
        "user-1",
      );
      const feedId = result.feed?.id as string;

      const deleteResult = await feedService.deleteFeed(feedId, "user-2");
      expect(deleteResult.success).toBe(false);
      expect(deleteResult.error).toBe("Feed not found");

      const user1Feeds = await feedService.getAllFeeds("user-1");
      expect(user1Feeds).toHaveLength(1);
    });
  });

  describe("toggleFeedStatus", () => {
    it("should toggle feed from active to inactive for user", async () => {
      const result = await feedService.createFeed(
        {
          title: "Test Feed",
          url: "https://example.com/feed.xml",
        },
        "user-1",
      );
      expect(result.feed).toBeDefined();
      const feedId = result.feed?.id as string;

      const toggleResult = await feedService.toggleFeedStatus(feedId, "user-1");
      expect(toggleResult.success).toBe(true);
      expect(toggleResult.feed?.status).toBe("inactive");
    });
  });
});
