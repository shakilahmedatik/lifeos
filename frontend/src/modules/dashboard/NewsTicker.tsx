import { useCallback, useEffect, useState } from "react";

import type { NewsArticle } from "../news/api.ts";
import { fetchTickerArticles } from "../news/api.ts";

export function NewsTicker() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadArticles = useCallback(async () => {
    try {
      const data = await fetchTickerArticles();
      setArticles(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load news");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();

    const intervalId = setInterval(loadArticles, 60000);

    return () => clearInterval(intervalId);
  }, [loadArticles]);

  const handleArticleClick = (article: NewsArticle) => {
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

  if (loading) {
    return (
      <div className="rounded border bg-gray-50 p-3">
        <div className="text-sm text-gray-500">Loading news...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded border bg-gray-50 p-3">
        <div className="text-sm text-red-500">{error}</div>
      </div>
    );
  }

  if (articles.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded border bg-gray-50">
      <div className="border-b bg-gray-100 px-3 py-2">
        <h3 className="text-sm font-medium text-gray-700">News</h3>
      </div>
      <div className="divide-y">
        {articles.map((article) => (
          <button
            key={article.id}
            type="button"
            className="w-full cursor-pointer px-3 py-2 text-left transition-colors hover:bg-gray-100"
            onClick={() => handleArticleClick(article)}
          >
            <div className="line-clamp-1 text-sm font-medium">{article.title}</div>
            <div className="mt-1 text-xs text-gray-500">{formatDate(article.publishedAt)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
