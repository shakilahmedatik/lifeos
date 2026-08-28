import type { NewRssFeedInput, RssFeed } from "../domain/types.js";
import type { RssFeedRepository } from "../ports/repositories.js";

export function createFeedService(feedRepository: RssFeedRepository) {
  return {
    async getAllFeeds(userId?: string): Promise<RssFeed[]> {
      return await feedRepository.getAll(userId);
    },

    async getActiveFeeds(userId?: string): Promise<RssFeed[]> {
      return await feedRepository.getActive(userId);
    },

    async getFeedById(id: string, userId?: string): Promise<RssFeed | undefined> {
      return await feedRepository.getById(id, userId);
    },

    async createFeed(
      input: NewRssFeedInput,
      userId?: string,
    ): Promise<{ success: boolean; feed?: RssFeed; error?: string }> {
      const existing = await feedRepository.getByUrl(input.url, userId);
      if (existing) {
        return { success: false, error: "Feed already exists" };
      }

      const id = crypto.randomUUID();
      const feed = await feedRepository.create(id, input, userId);
      return { success: true, feed };
    },

    async updateFeed(
      id: string,
      patch: Partial<NewRssFeedInput>,
      userId?: string,
    ): Promise<{ success: boolean; feed?: RssFeed; error?: string }> {
      const existing = await feedRepository.getById(id, userId);
      if (!existing) {
        return { success: false, error: "Feed not found" };
      }

      if (patch.url) {
        const duplicate = await feedRepository.getByUrl(patch.url, userId);
        if (duplicate && duplicate.id !== id) {
          return { success: false, error: "Feed URL already exists" };
        }
      }

      const feed = await feedRepository.update(id, patch, userId);
      return { success: true, feed };
    },

    async deleteFeed(id: string, userId?: string): Promise<{ success: boolean; error?: string }> {
      const existing = await feedRepository.getById(id, userId);
      if (!existing) {
        return { success: false, error: "Feed not found" };
      }

      await feedRepository.delete(id, userId);
      return { success: true };
    },

    async toggleFeedStatus(
      id: string,
      userId?: string,
    ): Promise<{ success: boolean; feed?: RssFeed; error?: string }> {
      const existing = await feedRepository.getById(id, userId);
      if (!existing) {
        return { success: false, error: "Feed not found" };
      }

      const newStatus = existing.status === "active" ? "inactive" : "active";
      const feed = await feedRepository.updateStatus(id, newStatus, userId);
      return { success: true, feed };
    },
  };
}
