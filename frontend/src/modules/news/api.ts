import type {
  NewsArticle as _NewsArticle,
  RssFeed as _RssFeed,
} from "../../../../packages/contracts/src/index.js";

export type RssFeed = _RssFeed;
export type NewsArticle = _NewsArticle;

const API_BASE = "/api/news";

// Feed API
export async function fetchFeeds(): Promise<RssFeed[]> {
  const res = await fetch(`${API_BASE}/feeds`);
  if (!res.ok) throw new Error("Failed to fetch feeds");
  return res.json();
}

export async function fetchFeed(id: string): Promise<RssFeed> {
  const res = await fetch(`${API_BASE}/feeds/${id}`);
  if (!res.ok) throw new Error("Failed to fetch feed");
  return res.json();
}

export async function createFeed(input: { title: string; url: string }): Promise<RssFeed> {
  const res = await fetch(`${API_BASE}/feeds`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create feed");
  }
  return res.json();
}

export async function updateFeed(
  id: string,
  patch: { title?: string; url?: string },
): Promise<RssFeed> {
  const res = await fetch(`${API_BASE}/feeds/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update feed");
  }
  return res.json();
}

export async function deleteFeed(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/feeds/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete feed");
}

export async function toggleFeedStatus(id: string): Promise<RssFeed> {
  const res = await fetch(`${API_BASE}/feeds/${id}/toggle`, { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to toggle feed status");
  return res.json();
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

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch articles");
  return res.json();
}

export async function fetchTickerArticles(): Promise<NewsArticle[]> {
  const res = await fetch(`${API_BASE}/articles/ticker`);
  if (!res.ok) throw new Error("Failed to fetch ticker articles");
  return res.json();
}

export async function markArticleAsRead(id: string): Promise<NewsArticle> {
  const res = await fetch(`${API_BASE}/articles/${id}/read`, { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to mark article as read");
  return res.json();
}
