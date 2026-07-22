import type { NewRssFeedInput, RssFeed } from "../domain/types.js";
import type { RssFeedRepository } from "../ports/repositories.js";

export function createFeedService(feedRepository: RssFeedRepository) {
  return {
    getAllFeeds(): RssFeed[] {
      return feedRepository.getAll();
    },

    getActiveFeeds(): RssFeed[] {
      return feedRepository.getActive();
    },

    getFeedById(id: string): RssFeed | undefined {
      return feedRepository.getById(id);
    },

    createFeed(input: NewRssFeedInput): { success: boolean; feed?: RssFeed; error?: string } {
      const existing = feedRepository.getByUrl(input.url);
      if (existing) {
        return { success: false, error: "Feed already exists" };
      }

      const id = crypto.randomUUID();
      const feed = feedRepository.create(id, input);
      return { success: true, feed };
    },

    updateFeed(
      id: string,
      patch: Partial<NewRssFeedInput>,
    ): { success: boolean; feed?: RssFeed; error?: string } {
      const existing = feedRepository.getById(id);
      if (!existing) {
        return { success: false, error: "Feed not found" };
      }

      if (patch.url) {
        const duplicate = feedRepository.getByUrl(patch.url);
        if (duplicate && duplicate.id !== id) {
          return { success: false, error: "Feed URL already exists" };
        }
      }

      const feed = feedRepository.update(id, patch);
      return { success: true, feed };
    },

    deleteFeed(id: string): { success: boolean; error?: string } {
      const existing = feedRepository.getById(id);
      if (!existing) {
        return { success: false, error: "Feed not found" };
      }

      feedRepository.delete(id);
      return { success: true };
    },

    toggleFeedStatus(id: string): { success: boolean; feed?: RssFeed; error?: string } {
      const existing = feedRepository.getById(id);
      if (!existing) {
        return { success: false, error: "Feed not found" };
      }

      const newStatus = existing.status === "active" ? "inactive" : "active";
      const feed = feedRepository.updateStatus(id, newStatus);
      return { success: true, feed };
    },
  };
}
