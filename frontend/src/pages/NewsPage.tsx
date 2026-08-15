import type { NewsArticle, RssFeed } from "@lifeos/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Edit2 as EditIcon,
  Newspaper as NewspaperIcon,
  Plus as PlusIcon,
  RefreshCw as RefreshCwIcon,
  Trash2 as TrashIcon,
} from "lucide-react";
import { useState } from "react";
import PageSkeleton from "../components/PageSkeleton.js";
import { useAppToast } from "../components/Toast.js";
import Button from "../components/ui/Button.js";
import Card, { CardHeader, CardTitle } from "../components/ui/Card.js";
import { EmptyState } from "../components/ui/EmptyState.js";
import { FilterPills } from "../components/ui/FilterPills.js";
import { Input } from "../components/ui/Input.js";
import Modal from "../components/ui/Modal.js";
import ModalFooter from "../components/ui/ModalFooter.js";
import { OnlineOnlyBanner } from "../components/ui/OnlineOnlyBanner.js";
import { PageHeader } from "../components/ui/PageHeader.js";
import { SearchInput } from "../components/ui/SearchInput.js";
import { openExternalUrl } from "../lib/openExternal.js";
import { queryKeys } from "../lib/queryKeys.js";
import * as newsApi from "../modules/news/api.js";

export default function NewsPage() {
  const queryClient = useQueryClient();
  const toast = useAppToast();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFeed, setEditingFeed] = useState<RssFeed | null>(null);

  const [feedTitle, setFeedTitle] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");

  const [filterFeedId, setFilterFeedId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const feedsQuery = useQuery<RssFeed[]>({
    queryKey: queryKeys.news.feeds(),
    queryFn: () => newsApi.fetchFeeds(),
  });

  const articlesQuery = useQuery<NewsArticle[]>({
    queryKey: queryKeys.news.articles(filterFeedId, searchQuery),
    queryFn: () =>
      newsApi.fetchArticles({
        feedId: filterFeedId || undefined,
        search: searchQuery || undefined,
        limit: 50,
      }),
  });

  const invalidateNews = () => {
    queryClient.invalidateQueries({ queryKey: ["news"] });
  };

  const refreshAllMutation = useMutation({
    mutationFn: () => newsApi.refreshAllFeeds(),
    onSuccess: (res) => {
      invalidateNews();
      if (res.newArticles > 0) {
        toast.success(`Feeds updated! Fetched ${res.newArticles} new article(s).`);
      } else {
        toast.success("Feeds are up to date.");
      }
    },
    onError: () => toast.error("Failed to refresh news feeds"),
  });

  const addFeedMutation = useMutation({
    mutationFn: ({ title, url }: { title: string; url: string }) =>
      newsApi.createFeed({ title, url }),
    onSuccess: () => {
      setFeedTitle("");
      setFeedUrl("");
      setShowAddForm(false);
      toast.success("Feed added successfully!");
      invalidateNews();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to add feed"),
  });

  const updateFeedMutation = useMutation({
    mutationFn: ({ id, title, url }: { id: string; title: string; url: string }) =>
      newsApi.updateFeed(id, { title, url }),
    onSuccess: () => {
      setEditingFeed(null);
      toast.success("Feed updated successfully!");
      invalidateNews();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update feed"),
  });

  const toggleFeedMutation = useMutation({
    mutationFn: (id: string) => newsApi.toggleFeedStatus(id),
    onSuccess: () => invalidateNews(),
    onError: () => toast.error("Failed to update feed status"),
  });

  const deleteFeedMutation = useMutation({
    mutationFn: (id: string) => newsApi.deleteFeed(id),
    onSuccess: (_, id) => {
      if (filterFeedId === id) setFilterFeedId("");
      toast.success("Feed deleted");
      invalidateNews();
    },
    onError: () => toast.error("Failed to delete feed"),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => newsApi.markArticleAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.news.articles(filterFeedId, searchQuery),
      });
      const previous = queryClient.getQueryData<NewsArticle[]>(
        queryKeys.news.articles(filterFeedId, searchQuery),
      );
      queryClient.setQueryData<NewsArticle[]>(
        queryKeys.news.articles(filterFeedId, searchQuery),
        (old = []) => old.map((a) => (a.id === id ? { ...a, isRead: true } : a)),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.news.articles(filterFeedId, searchQuery),
          context.previous,
        );
      }
      toast.error("Failed to mark article as read");
    },
  });

  const feeds = feedsQuery.data ?? [];
  const articles = articlesQuery.data ?? [];
  const loading = feedsQuery.isLoading || articlesQuery.isLoading;

  const handleAddFeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedUrl.trim()) return;
    addFeedMutation.mutate({
      title: feedTitle.trim() || feedUrl.trim(),
      url: feedUrl.trim(),
    });
  };

  const handleUpdateFeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeed || !editUrl.trim()) return;
    updateFeedMutation.mutate({
      id: editingFeed.id,
      title: editTitle.trim() || editUrl.trim(),
      url: editUrl.trim(),
    });
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
              loading={refreshAllMutation.isPending}
              icon={
                <RefreshCwIcon
                  size={14}
                  className={refreshAllMutation.isPending ? "animate-spin" : ""}
                />
              }
              onClick={() => refreshAllMutation.mutate()}
            >
              Refresh
            </Button>
            <Button size="sm" icon={<PlusIcon size={14} />} onClick={() => setShowAddForm(true)}>
              Add Feed
            </Button>
          </>
        }
      />

      <OnlineOnlyBanner moduleName="News & RSS Feeds" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {feeds.length > 0 && (
          <FilterPills
            options={["All Feeds", ...feeds.map((f) => f.title)]}
            active={
              filterFeedId
                ? feeds.find((f) => f.id === filterFeedId)?.title || "All Feeds"
                : "All Feeds"
            }
            onChange={(val) => {
              if (val === "All Feeds") setFilterFeedId("");
              else {
                const f = feeds.find((x) => x.title === val);
                if (f) setFilterFeedId(f.id);
              }
            }}
          />
        )}

        <div className="relative min-w-50">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search articles..."
          />
        </div>
      </div>

      {loading ? (
        <PageSkeleton />
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
                    if (!a.isRead) markReadMutation.mutate(a.id);
                    openExternalUrl(a.url);
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary truncate">{a.title}</p>
                      {a.summary && (
                        <p className="text-xs text-secondary mt-0.5 line-clamp-2">{a.summary}</p>
                      )}
                      <p className="text-xs text-muted mt-1">
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
                      className="flex items-center justify-between py-1.5 border-b border-border/60 last:border-0"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-sm text-primary truncate font-medium">{f.title}</p>
                        <p className="text-xs text-muted truncate">{f.url}</p>
                        {f.lastFetchError && (
                          <p className="text-[10px] text-red-400 truncate mt-0.5">
                            Error: {f.lastFetchError}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleFeedMutation.mutate(f.id)}
                          className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                            f.status === "active"
                              ? "bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60"
                              : "bg-card-solid text-muted hover:bg-card-hover"
                          }`}
                        >
                          {f.status}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(f)}
                          className="p-1 rounded text-muted hover:text-blue-400 transition-colors"
                          title="Edit Feed"
                        >
                          <EditIcon size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteFeedMutation.mutate(f.id)}
                          className="p-1 rounded text-muted hover:text-red-400 transition-colors"
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
          <ModalFooter>
            <Button variant="secondary" type="button" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Feed</Button>
          </ModalFooter>
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
          <ModalFooter>
            <Button variant="secondary" type="button" onClick={() => setEditingFeed(null)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
