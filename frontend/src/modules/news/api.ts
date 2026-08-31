import type { NewsArticle as _NewsArticle, RssFeed as _RssFeed } from "@lifeos/contracts";
import { request } from "../../lib/api.js";
import { getDataSource } from "../../lib/dataSource.js";

export type RssFeed = _RssFeed;
export type NewsArticle = _NewsArticle;

const API_BASE = "/api/news";

// Feed API
export async function fetchFeeds(): Promise<RssFeed[]> {
  return (await getDataSource()).getNewsFeeds();
}

export async function fetchFeed(id: string): Promise<RssFeed> {
  return (await getDataSource()).getNewsFeed(id);
}

export async function createFeed(input: { title: string; url: string }): Promise<RssFeed> {
  return (await getDataSource()).createNewsFeed(input);
}

export async function updateFeed(
  id: string,
  patch: { title?: string; url?: string },
): Promise<RssFeed> {
  return (await getDataSource()).updateNewsFeed(id, patch);
}

export async function deleteFeed(id: string): Promise<void> {
  return (await getDataSource()).deleteNewsFeed(id);
}

export async function toggleFeedStatus(id: string): Promise<RssFeed> {
  return (await getDataSource()).toggleNewsFeedStatus(id);
}

export async function refreshFeed(id: string): Promise<{ newArticles: number }> {
  try {
    return await request<{ newArticles: number }>(`${API_BASE}/feeds/${id}/refresh`, {
      method: "POST",
    });
  } catch {
    return { newArticles: 0 };
  }
}

export async function refreshAllFeeds(): Promise<{
  success: boolean;
  totalFeeds: number;
  newArticles: number;
}> {
  try {
    return await request<{ success: boolean; totalFeeds: number; newArticles: number }>(
      `${API_BASE}/feeds/refresh-all`,
      { method: "POST" },
    );
  } catch {
    const feeds = await fetchFeeds();
    return { success: true, totalFeeds: feeds.length, newArticles: 0 };
  }
}

// Article API
export async function fetchArticles(params?: {
  feedId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<NewsArticle[]> {
  return (await getDataSource()).getNewsArticles(params);
}

export async function fetchTickerArticles(): Promise<NewsArticle[]> {
  return (await getDataSource()).getTickerArticles();
}

export async function markArticleAsRead(id: string): Promise<NewsArticle> {
  return (await getDataSource()).markNewsArticleAsRead(id);
}
