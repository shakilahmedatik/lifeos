import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Search } from "lucide-react";
import { EmptyState } from "../../components/ui/EmptyState.js";
import type { NewsArticle, RssFeed } from "./api.ts";
import { fetchArticles, fetchFeeds, markArticleAsRead } from "./api.ts";

export function NewsDigest() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeedId, setSelectedFeedId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastArticleRef = useRef<HTMLButtonElement | null>(null);

  const loadArticles = useCallback(
    async (reset = false) => {
      try {
        setLoading(true);
        const newOffset = reset ? 0 : offset;
        const data = await fetchArticles({
          feedId: selectedFeedId || undefined,
          search: searchQuery || undefined,
          limit: 20,
          offset: newOffset,
        });

        if (reset) {
          setArticles(data);
          setOffset(20);
        } else {
          setArticles((prev) => [...prev, ...data]);
          setOffset((prev) => prev + 20);
        }

        setHasMore(data.length === 20);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load articles");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedFeedId, searchQuery, offset],
  );

  const loadFeeds = useCallback(async () => {
    try {
      const data = await fetchFeeds();
      setFeeds(data);
    } catch (err) {
      console.error("Failed to load feeds:", err);
    }
  }, []);

  useEffect(() => {
    loadFeeds();
  }, [loadFeeds]);

  useEffect(() => {
    loadArticles(true);
  }, [loadArticles]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          setLoadingMore(true);
          loadArticles(false);
        }
      },
      { threshold: 0.1 },
    );

    if (lastArticleRef.current) {
      observerRef.current.observe(lastArticleRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, loadingMore, loading, loadArticles]);

  const handleArticleClick = async (article: NewsArticle) => {
    if (!article.isRead) {
      try {
        await markArticleAsRead(article.id);
        setArticles((prev) => prev.map((a) => (a.id === article.id ? { ...a, isRead: true } : a)));
      } catch (err) {
        console.error("Failed to mark article as read:", err);
      }
    }
    window.open(article.url, "_blank");
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">News Digest</h1>
      </div>

      {error && (
        <div className="mb-4 rounded bg-red-100 p-3 text-red-700">
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="feed-filter" className="mb-1 block text-sm font-medium">
            Filter by Feed
          </label>
          <select
            id="feed-filter"
            value={selectedFeedId}
            onChange={(e) => setSelectedFeedId(e.target.value)}
            className="w-full rounded border px-3 py-2"
          >
            <option value="">All Feeds</option>
            {feeds.map((feed) => (
              <option key={feed.id} value={feed.id}>
                {feed.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="search" className="mb-1 block text-sm font-medium">
            Search
          </label>
          <input
            type="text"
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles..."
            className="w-full rounded border px-3 py-2"
          />
        </div>
      </div>

      {loading && articles.length === 0 ? (
        <div className="text-center text-muted">Loading articles...</div>
      ) : articles.length === 0 ? (
        <EmptyState
          title={
            searchQuery
              ? "No articles found matching your search"
              : "No articles available. Add some RSS feeds to get started."
          }
          className="py-12"
        />
      ) : (
        <div className="space-y-4">
          {articles.map((article, index) => (
            <button
              key={article.id}
              type="button"
              ref={index === articles.length - 1 ? lastArticleRef : undefined}
              className={`w-full cursor-pointer rounded border p-4 text-left transition-colors hover:bg-card ${
                article.isRead ? "opacity-60" : ""
              }`}
              onClick={() => handleArticleClick(article)}
            >
              <div className="mb-1 flex items-center gap-2">
                <h3 className="font-medium">{article.title}</h3>
                {article.isRead && (
                  <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-muted">
                    Read
                  </span>
                )}
              </div>
              {article.summary && (
                <p className="mb-2 line-clamp-2 text-sm text-muted">{article.summary}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted">
                <span>{feeds.find((f) => f.id === article.feedId)?.title || "Unknown Feed"}</span>
                <span>{formatDate(article.publishedAt)}</span>
              </div>
            </button>
          ))}
          {loadingMore && <div className="text-center text-muted">Loading more...</div>}
          {!hasMore && articles.length > 0 && (
            <div className="text-center text-muted">No more articles</div>
          )}
        </div>
      )}
    </div>
  );
}
