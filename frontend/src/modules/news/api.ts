import type { NewsArticle as _NewsArticle, RssFeed as _RssFeed } from "@lifeos/contracts";
import { request } from "../../lib/api.js";

export type RssFeed = _RssFeed;
export type NewsArticle = _NewsArticle;

const API_BASE = "/api/news";

// Feed API
export async function fetchFeeds(): Promise<RssFeed[]> {
  return request<RssFeed[]>(`${API_BASE}/feeds`);
}

export async function fetchFeed(id: string): Promise<RssFeed> {
  return request<RssFeed>(`${API_BASE}/feeds/${id}`);
}

export async function createFeed(input: { title: string; url: string }): Promise<RssFeed> {
  return request<RssFeed>(`${API_BASE}/feeds`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function updateFeed(
  id: string,
  patch: { title?: string; url?: string },
): Promise<RssFeed> {
  return request<RssFeed>(`${API_BASE}/feeds/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function deleteFeed(id: string): Promise<void> {
  return request<void>(`${API_BASE}/feeds/${id}`, { method: "DELETE" });
}

export async function toggleFeedStatus(id: string): Promise<RssFeed> {
  return request<RssFeed>(`${API_BASE}/feeds/${id}/toggle`, { method: "PATCH" });
}

// Article API
export async function fetchArticles(params?: {
  feedId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<NewsArticle[]> {
  const searchParams = new URLSearchParams();
  if (params?.feedId) searchParams.set("feedId", params.feedId);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());

  const queryString = searchParams.toString();
  const url = `${API_BASE}/articles${queryString ? `?${queryString}` : ""}`;

  return request<NewsArticle[]>(url);
}

export async function fetchTickerArticles(): Promise<NewsArticle[]> {
  return request<NewsArticle[]>(`${API_BASE}/articles/ticker`);
}

export async function markArticleAsRead(id: string): Promise<NewsArticle> {
  return request<NewsArticle>(`${API_BASE}/articles/${id}/read`, { method: "PATCH" });
}
