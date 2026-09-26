import type { RoutineCategory } from "@lifeos/contracts";
import { Edit2, Layers, Plus, Trash2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useAppToast } from "../../components/Toast.js";
import Button from "../../components/ui/Button.js";
import Card, { CardContent } from "../../components/ui/Card.js";
import { ColorPicker } from "../../components/ui/ColorPicker.js";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { ErrorBanner } from "../../components/ui/ErrorBanner.js";
import { Input } from "../../components/ui/Input.js";
import ListSkeleton from "../../components/ui/ListSkeleton.js";
import Modal from "../../components/ui/Modal.js";
import ModalFooter from "../../components/ui/ModalFooter.js";
import { useRoutineCategories } from "./hooks/useRoutineCategories.js";
import TaskCategoryBadge from "./TaskCategoryBadge.js";

const PRESET_ICONS = [
  "⏱️",
  "⚡",
  "💼",
  "🏋️",
  "📚",
  "🔥",
  "🧘",
  "🎯",
  "🎨",
  "💻",
  "🔬",
  "🎧",
  "🚀",
  "☕",
  "💡",
  "📝",
  "🌟",
  "🛠️",
  "🤝",
  "🌱",
];

const PRESET_COLORS = [
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#10b981", // Emerald
  "#a855f7", // Purple
  "#f97316", // Orange
  "#ec4899", // Pink
  "#14b8a6", // Teal
  "#6366f1", // Indigo
  "#eab308", // Yellow
  "#8b5cf6", // Violet
  "#06b6d4", // Cyan
  "#6b7280", // Gray
];

export function RoutineCategoryManager() {
  const {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    isCreating,
    isUpdating,
    isDeleting,
  } = useRoutineCategories();

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<RoutineCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<RoutineCategory | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [icon, setIcon] = useState("⚡");
  const [formError, setFormError] = useState<string | null>(null);

  const toast = useAppToast();

  const resetForm = () => {
    setName("");
    setColor("#3b82f6");
    setIcon("⚡");
    setFormError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (cat: RoutineCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
    setColor(cat.color || "#3b82f6");
    setIcon(cat.icon || "");
    setFormError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Category name is required");
      return;
    }

    try {
      await createCategory({
        name: name.trim(),
        color,
        icon: icon.trim() || undefined,
      });
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create category");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !name.trim()) {
      setFormError("Category name is required");
      return;
    }

    try {
      await updateCategory({
        id: editingCategory.id,
        patch: {
          name: name.trim(),
          color,
          icon: icon.trim() || undefined,
        },
      });
      setEditingCategory(null);
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to update category");
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    try {
      await deleteCategory({ id: deletingCategory.id, fallback: "general" });
      setDeletingCategory(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete category");
    }
  };

  if (loading) {
    return <ListSkeleton count={4} height="h-20" gap="gap-4" />;
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface-elevated p-4 rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-primary">Routine Categories</h2>
            <p className="text-xs text-secondary">
              Organize your time blocks and schedules with custom tags and colors
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={handleOpenAdd}
          aria-label="Add category"
        >
          New Category
        </Button>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <EmptyState
          title="No Categories Configured"
          description="Create your first routine category to begin categorizing tasks."
          action={
            <Button size="sm" variant="primary" icon={<Plus size={14} />} onClick={handleOpenAdd}>
              Create Category
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Card
              key={cat.id}
              className="relative overflow-hidden group hover:border-accent/40 transition-all shadow-sm"
            >
              {/* Color Accent Indicator Strip */}
              <div
                className="absolute top-0 left-0 bottom-0 w-1.5"
                style={{ backgroundColor: cat.color || "#3b82f6" }}
              />

              <CardContent className="p-1">
                <div className="flex items-start justify-between gap-2">
                  <TaskCategoryBadge category={cat.id} categoryObj={cat} className="text-[14px]" />

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1.5 text-secondary hover:text-primary rounded-lg cursor-pointer"
                      onClick={() => handleOpenEdit(cat)}
                      aria-label={`Edit ${cat.name}`}
                      title="Edit Category"
                    >
                      <Edit2 size={13} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1.5 text-secondary hover:text-red-400 rounded-lg cursor-pointer"
                      onClick={() => setDeletingCategory(cat)}
                      aria-label={`Delete ${cat.name}`}
                      title="Delete Category"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      <Modal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Create Routine Category"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <ErrorBanner message={formError} />}

          <Input
            id="create-category-name"
            label="Category Name *"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Deep Work, Freelance, Reading"
            required
            autoFocus
          />

          {/* Color Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-secondary">Badge Color</label>
            <ColorPicker value={color} onChange={setColor} colors={PRESET_COLORS} />
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-secondary">Custom Hex:</span>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#3b82f6"
                className="w-28 px-2 py-1 text-xs rounded-lg bg-card-hover border border-border text-primary font-mono"
              />
            </div>
          </div>

          {/* Icon Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-secondary">
              Icon / Emoji (Optional)
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {PRESET_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center border transition-all ${
                    icon === emoji
                      ? "border-blue-500 bg-blue-500/20 scale-110"
                      : "border-border bg-card-hover hover:bg-surface-elevated"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-secondary">Custom Emoji:</span>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="⚡"
                maxLength={4}
                className="w-16 px-2 py-1 text-xs rounded-lg bg-card-hover border border-border text-primary text-center"
              />
            </div>
          </div>

          {/* Live Preview */}
          <div className="p-3 bg-surface rounded-xl border border-border">
            <span className="block text-xs font-medium text-secondary mb-1.5">Live Preview:</span>
            <div className="flex items-center gap-2">
              <TaskCategoryBadge
                category={name || "Category Preview"}
                categoryObj={{
                  id: "preview",
                  name: name || "Category Preview",
                  color,
                  icon: icon || undefined,
                  createdAt: "",
                  updatedAt: "",
                }}
              />
            </div>
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" variant="primary" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Category"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Edit Category Modal */}
      {editingCategory && (
        <Modal
          open={true}
          onClose={() => {
            setEditingCategory(null);
            resetForm();
          }}
          title="Edit Category"
          size="md"
        >
          <form onSubmit={handleUpdate} className="space-y-4">
            {formError && <ErrorBanner message={formError} />}

            <Input
              id="edit-category-name"
              label="Category Name *"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            {/* Color Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-secondary">Badge Color</label>
              <ColorPicker value={color} onChange={setColor} colors={PRESET_COLORS} />
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-secondary">Custom Hex:</span>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#3b82f6"
                  className="w-28 px-2 py-1 text-xs rounded-lg bg-card-hover border border-border text-primary font-mono"
                />
              </div>
            </div>

            {/* Icon Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-secondary">
                Icon / Emoji (Optional)
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {PRESET_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center border transition-all ${
                      icon === emoji
                        ? "border-blue-500 bg-blue-500/20 scale-110"
                        : "border-border bg-card-hover hover:bg-surface-elevated"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-secondary">Custom Emoji:</span>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="⚡"
                  maxLength={4}
                  className="w-16 px-2 py-1 text-xs rounded-lg bg-card-hover border border-border text-primary text-center"
                />
              </div>
            </div>

            {/* Live Preview */}
            <div className="p-3 bg-surface rounded-xl border border-border">
              <span className="block text-xs font-medium text-secondary mb-1.5">Live Preview:</span>
              <div className="flex items-center gap-2">
                <TaskCategoryBadge
                  category={name || "Category Preview"}
                  categoryObj={{
                    id: editingCategory.id,
                    name: name || "Category Preview",
                    color,
                    icon: icon || undefined,
                    createdAt: "",
                    updatedAt: "",
                  }}
                />
              </div>
            </div>

            <ModalFooter>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setEditingCategory(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" variant="primary" disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deletingCategory)}
        title={`Delete Category "${deletingCategory?.name}"`}
        message={`Are you sure you want to delete this category? Any existing tasks assigned to "${deletingCategory?.name}" will automatically be reassigned to the "General" category.`}
        confirmLabel={isDeleting ? "Deleting..." : "Delete Category"}
        onConfirm={handleDelete}
        onCancel={() => setDeletingCategory(null)}
      />
    </div>
  );
}
