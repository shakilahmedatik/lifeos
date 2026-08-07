import { useCallback, useEffect, useState } from "react";

import type { RssFeed } from "./api.ts";
import { createFeed, deleteFeed, fetchFeeds, toggleFeedStatus, updateFeed } from "./api.ts";

export function FeedManagement() {
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFeed, setEditingFeed] = useState<RssFeed | null>(null);
  const [formData, setFormData] = useState({ title: "", url: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadFeeds = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchFeeds();
      setFeeds(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feeds");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeeds();
  }, [loadFeeds]);

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createFeed(formData);
      setFormData({ title: "", url: "" });
      setShowAddForm(false);
      await loadFeeds();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add feed");
    }
  };

  const handleUpdateFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeed) return;

    try {
      await updateFeed(editingFeed.id, formData);
      setFormData({ title: "", url: "" });
      setEditingFeed(null);
      await loadFeeds();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update feed");
    }
  };

  const handleDeleteFeed = async (id: string) => {
    try {
      await deleteFeed(id);
      setDeleteConfirm(null);
      await loadFeeds();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete feed");
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleFeedStatus(id);
      await loadFeeds();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle feed status");
    }
  };

  const startEditing = (feed: RssFeed) => {
    setEditingFeed(feed);
    setFormData({ title: feed.title, url: feed.url });
    setShowAddForm(false);
  };

  const cancelEditing = () => {
    setEditingFeed(null);
    setFormData({ title: "", url: "" });
  };

  if (loading) {
    return <div className="p-4">Loading feeds...</div>;
  }

  return (
    <div className="p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">RSS Feeds</h1>
        <button
          type="button"
          onClick={() => {
            setShowAddForm(true);
            setEditingFeed(null);
            setFormData({ title: "", url: "" });
          }}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Add Feed
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded bg-red-100 p-3 text-red-700">
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      {(showAddForm || editingFeed) && (
        <div className="mb-6 rounded border bg-card p-4">
          <h2 className="mb-3 text-lg font-semibold">
            {editingFeed ? "Edit Feed" : "Add New Feed"}
          </h2>
          <form onSubmit={editingFeed ? handleUpdateFeed : handleAddFeed}>
            <div className="mb-3">
              <label htmlFor="title" className="mb-1 block text-sm font-medium">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded border px-3 py-2"
                placeholder="Feed title (optional)"
              />
            </div>
            <div className="mb-3">
              <label htmlFor="url" className="mb-1 block text-sm font-medium">
                URL *
              </label>
              <input
                type="url"
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full rounded border px-3 py-2"
                placeholder="https://example.com/feed.xml"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
              >
                {editingFeed ? "Update" : "Add"}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                className="rounded bg-gray-300 px-4 py-2 text-muted hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {feeds.length === 0 ? (
        <div className="text-center text-muted">No feeds added yet.</div>
      ) : (
        <div className="space-y-3">
          {feeds.map((feed) => (
            <div key={feed.id} className="flex items-center justify-between rounded border p-3">
              <div className="flex-1">
                <div className="font-medium">{feed.title}</div>
                <div className="text-sm text-muted">{feed.url}</div>
                {feed.lastFetchError && (
                  <div className="mt-1 text-xs text-red-500">Last error: {feed.lastFetchError}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded px-2 py-1 text-xs ${
                    feed.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-card-hover text-muted"
                  }`}
                >
                  {feed.status}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleStatus(feed.id)}
                  className="text-sm text-blue-500 hover:underline"
                >
                  {feed.status === "active" ? "Disable" : "Enable"}
                </button>
                <button
                  type="button"
                  onClick={() => startEditing(feed)}
                  className="text-sm text-yellow-500 hover:underline"
                >
                  Edit
                </button>
                {deleteConfirm === feed.id ? (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleDeleteFeed(feed.id)}
                      className="text-sm text-red-500 hover:underline"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(null)}
                      className="text-sm text-muted hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(feed.id)}
                    className="text-sm text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
