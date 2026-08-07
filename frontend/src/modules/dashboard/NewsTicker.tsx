import { useCallback, useState } from "react";
import { RelativeTime } from "../../components/ui/RelativeTime.js";
import { useVisibilityPolling } from "../../lib/useVisibilityPolling.js";

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

  useVisibilityPolling(loadArticles, 60000);

  const handleArticleClick = (article: NewsArticle) => {
    window.open(article.url, "_blank");
  };

  if (loading) {
    return (
      <div className="rounded border bg-card p-3">
        <div className="text-sm text-muted">Loading news...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded border bg-card p-3">
        <div className="text-sm text-red-500">{error}</div>
      </div>
    );
  }

  if (articles.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded border bg-card">
      <div className="border-b bg-card-hover px-3 py-2">
        <h3 className="text-sm font-medium text-muted">News</h3>
      </div>
      <div className="divide-y">
        {articles.map((article) => (
          <button
            key={article.id}
            type="button"
            className="w-full cursor-pointer px-3 py-2 text-left transition-colors hover:bg-card-hover"
            onClick={() => handleArticleClick(article)}
          >
            <div className="line-clamp-1 text-sm font-medium">{article.title}</div>
            <div className="mt-1 text-xs text-muted">
              {article.publishedAt && <RelativeTime date={article.publishedAt} />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
