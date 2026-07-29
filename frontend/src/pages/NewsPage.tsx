import type { NewsArticle, RssFeed } from "@lifeos/contracts";
import {
  Newspaper as NewspaperIcon,
  Plus as PlusIcon,
  RefreshCw as RefreshCwIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAppToast } from "../components/Toast.js";
import Button from "../components/ui/Button.js";
import Card, { CardHeader, CardTitle } from "../components/ui/Card.js";
import { EmptyState } from "../components/ui/EmptyState.js";
import { Input } from "../components/ui/Input.js";
import Modal from "../components/ui/Modal.js";
import * as newsApi from "../modules/news/api.js";

export default function NewsPage() {
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [feedTitle, setFeedTitle] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [filterFeedId, setFilterFeedId] = useState("");
  const toast = useAppToast();

  const fetchData = useCallback(async () => {
    try {
      const [fds, arts] = await Promise.all([
        newsApi.fetchFeeds(),
        newsApi.fetchArticles({ limit: 50 }),
      ]);
      setFeeds(fds);
      setArticles(arts);
    } catch {
      toast.error("Failed to load news");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedTitle.trim() || !feedUrl.trim()) return;
    try {
      await newsApi.createFeed({ title: feedTitle.trim(), url: feedUrl.trim() });
      setFeedTitle("");
      setFeedUrl("");
      setShowForm(false);
      fetchData();
    } catch {
      toast.error("Failed to add feed");
    }
  };

  const handleToggleFeed = async (id: string) => {
    try {
      await newsApi.toggleFeedStatus(id);
      fetchData();
    } catch {
      toast.error("Failed to update feed");
    }
  };

  const handleDeleteFeed = async (id: string) => {
    try {
      await newsApi.deleteFeed(id);
      fetchData();
    } catch {
      toast.error("Failed to delete feed");
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await newsApi.markArticleAsRead(id);
      fetchData();
    } catch {
      toast.error("Failed to mark article as read");
    }
  };

  const filteredArticles = filterFeedId
    ? articles.filter((a) => a.feedId === filterFeedId)
    : articles;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">News</h1>
          <p className="text-sm text-gray-500 mt-1">Stay informed</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCwIcon size={14} />}
            onClick={fetchData}
          />
          <Button size="sm" icon={<PlusIcon size={14} />} onClick={() => setShowForm(true)}>
            Add Feed
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-800/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {feeds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterFeedId("")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  !filterFeedId
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                    : "bg-gray-800/60 text-gray-500 border border-gray-700/50 hover:text-gray-300"
                }`}
              >
                All
              </button>
              {feeds.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterFeedId(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filterFeedId === f.id
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                      : "bg-gray-800/60 text-gray-500 border border-gray-700/50 hover:text-gray-300"
                  }`}
                >
                  {f.title}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-2">
              {filteredArticles.length === 0 ? (
                <EmptyState icon={NewspaperIcon} title="No articles" />
              ) : (
                filteredArticles.map((a) => (
                  <Card
                    key={a.id}
                    padding="sm"
                    hover
                    className={`cursor-pointer ${a.isRead ? "opacity-60" : ""}`}
                    onClick={() => {
                      if (!a.isRead) handleMarkRead(a.id);
                      window.open(a.url, "_blank", "noopener,noreferrer");
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-200 truncate">{a.title}</p>
                        {a.summary && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.summary}</p>
                        )}
                        <p className="text-xs text-gray-600 mt-1">
                          {a.publishedAt
                            ? new Date(a.publishedAt).toLocaleDateString()
                            : new Date(a.fetchedAt).toLocaleDateString()}
                          {feeds.find((f) => f.id === a.feedId) && (
                            <> · {feeds.find((f) => f.id === a.feedId)?.title}</>
                          )}
                        </p>
                      </div>
                      {!a.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>

            <div className="space-y-3">
              <Card>
                <CardHeader>
                  <CardTitle>Feeds</CardTitle>
                </CardHeader>
                <div className="space-y-2">
                  {feeds.length === 0 ? (
                    <EmptyState title="No feeds added" />
                  ) : (
                    feeds.map((f) => (
                      <div key={f.id} className="flex items-center justify-between py-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-300 truncate">{f.title}</p>
                          <p className="text-xs text-gray-600 truncate">{f.url}</p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => handleToggleFeed(f.id)}
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              f.status === "active"
                                ? "bg-emerald-900/40 text-emerald-300"
                                : "bg-gray-700/50 text-gray-500"
                            }`}
                          >
                            {f.status}
                          </button>
                          <button
                            onClick={() => handleDeleteFeed(f.id)}
                            className="p-1 rounded text-gray-600 hover:text-red-400 transition-colors"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M18 6 6 18" />
                              <path d="m6 6 12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add RSS Feed">
        <form onSubmit={handleAddFeed} className="space-y-4">
          <div>
            <Input
              label="Title"
              type="text"
              value={feedTitle}
              onChange={(e) => setFeedTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              label="RSS URL"
              type="url"
              value={feedUrl}
              onChange={(e) => setFeedUrl(e.target.value)}
              placeholder="https://example.com/rss"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Feed</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
