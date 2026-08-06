import type { NewRssFeedInput, RssFeed } from "../domain/types.js";
import type { RssFeedRepository } from "../ports/repositories.js";

export function createFeedService(feedRepository: RssFeedRepository) {
  return {
    async getAllFeeds(): Promise<RssFeed[]> {
      return await feedRepository.getAll();
    },

    async getActiveFeeds(): Promise<RssFeed[]> {
      return await feedRepository.getActive();
    },

    async getFeedById(id: string): Promise<RssFeed | undefined> {
      return await feedRepository.getById(id);
    },

    async createFeed(
      input: NewRssFeedInput,
    ): Promise<{ success: boolean; feed?: RssFeed; error?: string }> {
      const existing = await feedRepository.getByUrl(input.url);
      if (existing) {
        return { success: false, error: "Feed already exists" };
      }

      const id = crypto.randomUUID();
      const feed = await feedRepository.create(id, input);
      return { success: true, feed };
    },

    async updateFeed(
      id: string,
      patch: Partial<NewRssFeedInput>,
    ): Promise<{ success: boolean; feed?: RssFeed; error?: string }> {
      const existing = await feedRepository.getById(id);
      if (!existing) {
        return { success: false, error: "Feed not found" };
      }

      if (patch.url) {
        const duplicate = await feedRepository.getByUrl(patch.url);
        if (duplicate && duplicate.id !== id) {
          return { success: false, error: "Feed URL already exists" };
        }
      }

      const feed = await feedRepository.update(id, patch);
      return { success: true, feed };
    },

    async deleteFeed(id: string): Promise<{ success: boolean; error?: string }> {
      const existing = await feedRepository.getById(id);
      if (!existing) {
        return { success: false, error: "Feed not found" };
      }

      await feedRepository.delete(id);
      return { success: true };
    },

    async toggleFeedStatus(
      id: string,
    ): Promise<{ success: boolean; feed?: RssFeed; error?: string }> {
      const existing = await feedRepository.getById(id);
      if (!existing) {
        return { success: false, error: "Feed not found" };
      }

      const newStatus = existing.status === "active" ? "inactive" : "active";
      const feed = await feedRepository.updateStatus(id, newStatus);
      return { success: true, feed };
    },
  };
}
