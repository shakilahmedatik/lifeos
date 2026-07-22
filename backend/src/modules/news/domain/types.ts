export type FeedStatus = "active" | "inactive";

export interface RssFeed {
  id: string;
  title: string;
  url: string;
  status: FeedStatus;
  lastFetchedAt?: string;
  lastFetchError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewRssFeedInput {
  title: string;
  url: string;
}

export interface NewsArticle {
  id: string;
  feedId: string;
  title: string;
  url: string;
  summary?: string;
  publishedAt?: string;
  fetchedAt: string;
  isRead: boolean;
}

export interface FeedWithArticleCount extends RssFeed {
  articleCount: number;
}
