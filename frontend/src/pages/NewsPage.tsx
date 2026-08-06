import type { NewsArticle, RssFeed } from "@lifeos/contracts";
import {
  Edit2 as EditIcon,
  Newspaper as NewspaperIcon,
  Plus as PlusIcon,
  RefreshCw as RefreshCwIcon,
  Search as SearchIcon,
  Trash2 as TrashIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAppToast } from "../components/Toast.js";
import Button from "../components/ui/Button.js";
import Card, { CardHeader, CardTitle } from "../components/ui/Card.js";
import { EmptyState } from "../components/ui/EmptyState.js";
import { Input } from "../components/ui/Input.js";
import Modal from "../components/ui/Modal.js";
import { PageHeader } from "../components/ui/PageHeader.js";
import * as newsApi from "../modules/news/api.js";

export default function NewsPage() {
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFeed, setEditingFeed] = useState<RssFeed | null>(null);

  const [feedTitle, setFeedTitle] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");

  const [filterFeedId, setFilterFeedId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const toast = useAppToast();

  const fetchData = useCallback(async () => {
    try {
      const [fds, arts] = await Promise.all([
        newsApi.fetchFeeds(),
        newsApi.fetchArticles({
          feedId: filterFeedId || undefined,
          search: searchQuery || undefined,
          limit: 50,
        }),
      ]);
      setFeeds(fds);
      setArticles(arts);
    } catch {
      toast.error("Failed to load news");
    } finally {
      setLoading(false);
    }
  }, [filterFeedId, searchQuery, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefreshAll = async () => {
    try {
      setRefreshing(true);
      const res = await newsApi.refreshAllFeeds();
      await fetchData();
      if (res.newArticles > 0) {
        toast.success(`Feeds updated! Fetched ${res.newArticles} new article(s).`);
      } else {
        toast.success("Feeds are up to date.");
      }
    } catch {
      toast.error("Failed to refresh news feeds");
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedUrl.trim()) return;
    try {
      await newsApi.createFeed({
        title: feedTitle.trim() || feedUrl.trim(),
        url: feedUrl.trim(),
      });
      setFeedTitle("");
      setFeedUrl("");
      setShowAddForm(false);
      toast.success("Feed added successfully!");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add feed");
    }
  };

  const handleUpdateFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeed || !editUrl.trim()) return;
    try {
      await newsApi.updateFeed(editingFeed.id, {
        title: editTitle.trim() || editUrl.trim(),
        url: editUrl.trim(),
      });
      setEditingFeed(null);
      toast.success("Feed updated successfully!");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update feed");
    }
  };

  const handleToggleFeed = async (id: string) => {
    try {
      await newsApi.toggleFeedStatus(id);
      fetchData();
    } catch {
      toast.error("Failed to update feed status");
    }
  };

  const handleDeleteFeed = async (id: string) => {
    try {
      await newsApi.deleteFeed(id);
      if (filterFeedId === id) setFilterFeedId("");
      toast.success("Feed deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete feed");
    }
  };

  const handleMarkRead = async (id: string) => {
    setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)));
    try {
      await newsApi.markArticleAsRead(id);
    } catch {
      toast.error("Failed to mark article as read");
    }
  };

  const startEdit = (feed: RssFeed) => {
    setEditingFeed(feed);
    setEditTitle(feed.title);
    setEditUrl(feed.url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="News"
        description="Stay informed with your RSS feeds"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              loading={refreshing}
              icon={<RefreshCwIcon size={14} className={refreshing ? "animate-spin" : ""} />}
              onClick={handleRefreshAll}
            >
              Refresh
            </Button>
            <Button size="sm" icon={<PlusIcon size={14} />} onClick={() => setShowAddForm(true)}>
              Add Feed
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {feeds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterFeedId("")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !filterFeedId
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                  : "bg-gray-800/60 text-gray-400 border border-gray-700/50 hover:text-gray-200"
              }`}
            >
              All Feeds
            </button>
            {feeds.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterFeedId(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterFeedId === f.id
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                    : "bg-gray-800/60 text-gray-400 border border-gray-700/50 hover:text-gray-200"
                }`}
              >
                {f.title}
              </button>
            ))}
          </div>
        )}

        <div className="relative min-w-[200px]">
          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-800/60 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-800/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-2">
            {articles.length === 0 ? (
              <EmptyState
                icon={NewspaperIcon}
                title={searchQuery ? "No matching articles" : "No articles"}
                description={
                  searchQuery
                    ? "Try adjusting your search criteria."
                    : "Add RSS feeds to start catching up on news."
                }
              />
            ) : (
              articles.map((a) => (
                <Card
                  key={a.id}
                  padding="sm"
                  hover
                  className={`cursor-pointer transition-opacity ${a.isRead ? "opacity-60" : ""}`}
                  onClick={() => {
                    if (!a.isRead) handleMarkRead(a.id);
                    window.open(a.url, "_blank", "noopener,noreferrer");
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{a.title}</p>
                      {a.summary && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{a.summary}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
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
                <CardTitle>Feeds ({feeds.length})</CardTitle>
              </CardHeader>
              <div className="space-y-2">
                {feeds.length === 0 ? (
                  <EmptyState title="No feeds added" />
                ) : (
                  feeds.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between py-1.5 border-b border-gray-800/60 last:border-0"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-sm text-gray-200 truncate">{f.title}</p>
                        <p className="text-xs text-gray-500 truncate">{f.url}</p>
                        {f.lastFetchError && (
                          <p className="text-[10px] text-red-400 truncate mt-0.5">
                            Error: {f.lastFetchError}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleToggleFeed(f.id)}
                          className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                            f.status === "active"
                              ? "bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60"
                              : "bg-gray-800 text-gray-500 hover:bg-gray-700"
                          }`}
                        >
                          {f.status}
                        </button>
                        <button
                          onClick={() => startEdit(f)}
                          className="p-1 rounded text-gray-500 hover:text-blue-400 transition-colors"
                          title="Edit Feed"
                        >
                          <EditIcon size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteFeed(f.id)}
                          className="p-1 rounded text-gray-500 hover:text-red-400 transition-colors"
                          title="Delete Feed"
                        >
                          <TrashIcon size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Add Feed Modal */}
      <Modal open={showAddForm} onClose={() => setShowAddForm(false)} title="Add RSS Feed">
        <form onSubmit={handleAddFeed} className="space-y-4">
          <div>
            <Input
              label="RSS URL *"
              type="url"
              value={feedUrl}
              onChange={(e) => setFeedUrl(e.target.value)}
              placeholder="https://example.com/rss.xml"
              required
            />
          </div>
          <div>
            <Input
              label="Feed Title (Optional)"
              type="text"
              value={feedTitle}
              onChange={(e) => setFeedTitle(e.target.value)}
              placeholder="Auto-detected from URL if left empty"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Feed</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Feed Modal */}
      <Modal open={!!editingFeed} onClose={() => setEditingFeed(null)} title="Edit RSS Feed">
        <form onSubmit={handleUpdateFeed} className="space-y-4">
          <div>
            <Input
              label="Feed Title"
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              label="RSS URL *"
              type="url"
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setEditingFeed(null)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

