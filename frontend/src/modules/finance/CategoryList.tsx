import type { Category } from "@lifeos/contracts";
import { Pencil, Plus, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAppToast } from "../../components/Toast.js";
import Badge from "../../components/ui/Badge.js";
import Button from "../../components/ui/Button.js";
import Card, { CardContent, CardHeader, CardTitle } from "../../components/ui/Card.js";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { Input } from "../../components/ui/Input.js";
import Modal from "../../components/ui/Modal.js";
import { Select } from "../../components/ui/Select.js";
import { Skeleton } from "../../components/ui/Skeleton.js";
import {
  archiveCategory as apiArchiveCategory,
  createCategory as apiCreateCategory,
  deleteCategory as apiDeleteCategory,
  unarchiveCategory as apiUnarchiveCategory,
  updateCategory as apiUpdateCategory,
} from "./api.js";
import { useCategories } from "./hooks/useCategories.js";

interface CategoryListProps {
  refreshTrigger?: number;
  onDataChange?: () => void;
}

function CategorySection({
  title,
  icon,
  borderColor,
  textColor,
  badgeVariant,
  categories,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
}: {
  title: string;
  icon: React.ReactNode;
  borderColor: string;
  textColor: string;
  badgeVariant: "success" | "danger" | "warning";
  categories: Category[];
  onEdit: (cat: Category) => void;
  onArchive: (id: string, name: string) => void;
  onUnarchive: (id: string, name: string) => void;
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <Card className={`glass ${borderColor}`}>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-border">
        <div className="flex items-center gap-2 font-medium">
          {icon}
          <CardTitle className={`text-sm ${textColor}`}>{title}</CardTitle>
        </div>
        <Badge variant={badgeVariant} className="text-[10px]">
          {categories.filter((c) => !c.archived).length} Active
        </Badge>
      </CardHeader>
      <CardContent className="p-3">
        {categories.length === 0 ? (
          <EmptyState title={`No ${title.toLowerCase()}`} />
        ) : (
          <div className="space-y-1.5">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-2 glass rounded-lg border border-border hover:border-accent/30 transition-colors"
              >
                <span
                  className={`text-xs ${cat.archived ? "text-muted line-through" : "text-primary"}`}
                >
                  {cat.name}
                </span>
                <div className="flex items-center gap-1 relative z-10">
                  {cat.archived ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-[11px] py-0.5 px-2 text-muted hover:text-emerald-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnarchive(cat.id, cat.name);
                      }}
                      title="Restore Category"
                    >
                      Unarchive
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="p-1 text-muted hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(cat);
                        }}
                        title="Edit Category"
                      >
                        <Pencil size={12} />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="p-1 text-muted text-[11px] hover:text-amber-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          onArchive(cat.id, cat.name);
                        }}
                        title="Archive Category"
                      >
                        Archive
                      </Button>
                    </>
                  )}
                  {!cat.archived && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="p-1 text-muted hover:text-amber-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(cat.id, cat.name);
                      }}
                      title="Delete Category"
                    >
                      <Trash2 size={12} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CategoryList({ refreshTrigger, onDataChange }: CategoryListProps) {
  const { categories, loading, refresh } = useCategories();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<"income" | "expense">("expense");
  const [submitting, setSubmitting] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{
    action: "delete" | "archive";
    id: string;
    name: string;
  } | null>(null);

  const prevRefreshTrigger = useRef(refreshTrigger);
  const toast = useAppToast();

  useEffect(() => {
    if (refreshTrigger !== prevRefreshTrigger.current) {
      prevRefreshTrigger.current = refreshTrigger;
      refresh();
    }
  }, [refreshTrigger, refresh]);

  function resetForm() {
    setNewName("");
    setNewKind("expense");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      await apiCreateCategory({ name: newName.trim(), kind: newKind });
      toast.success(`Category "${newName.trim()}" created`);
      resetForm();
      setShowAddModal(false);
      refresh();
      onDataChange?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(cat: Category) {
    setEditCategory(cat);
    setNewName(cat.name);
    setNewKind(cat.kind);
    setShowEditModal(true);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editCategory || !newName.trim()) return;
    setSubmitting(true);
    try {
      await apiUpdateCategory(editCategory.id, { name: newName.trim() });
      toast.success("Category updated");
      setShowEditModal(false);
      setEditCategory(null);
      resetForm();
      refresh();
      onDataChange?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update category");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleArchive(id: string, name: string) {
    try {
      await apiArchiveCategory(id);
      toast.success(`Archived category "${name}"`);
      refresh();
      onDataChange?.();
    } catch {
      toast.error("Failed to archive category");
    }
  }

  async function handleUnarchive(id: string, name: string) {
    try {
      await apiUnarchiveCategory(id);
      toast.success(`Restored category "${name}"`);
      refresh();
      onDataChange?.();
    } catch {
      toast.error("Failed to unarchive category");
    }
  }

  async function handleDelete(id: string, name: string) {
    try {
      await apiDeleteCategory(id);
      toast.success(`Deleted category "${name}"`);
      refresh();
      onDataChange?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete category");
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  const incomeCategories = categories.filter((c) => c.kind === "income");
  const expenseCategories = categories.filter((c) => c.kind === "expense");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-primary">Transaction Categories</h3>
          <p className="text-xs text-muted">Classify your income sources and spending habits</p>
        </div>
        <Button
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
        >
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CategorySection
          title="Income Categories"
          icon={<TrendingUp size={16} className="text-emerald-400" />}
          borderColor="border-emerald-500/20"
          textColor="text-emerald-400"
          badgeVariant="success"
          categories={incomeCategories}
          onEdit={openEdit}
          onArchive={(id, name) => setConfirmTarget({ action: "archive", id, name })}
          onUnarchive={handleUnarchive}
          onDelete={(id, name) => setConfirmTarget({ action: "delete", id, name })}
        />
        <CategorySection
          title="Expense Categories"
          icon={<TrendingDown size={16} className="text-amber-400" />}
          borderColor="border-amber-500/20"
          textColor="text-amber-400"
          badgeVariant="warning"
          categories={expenseCategories}
          onEdit={openEdit}
          onArchive={(id, name) => setConfirmTarget({ action: "archive", id, name })}
          onUnarchive={handleUnarchive}
          onDelete={(id, name) => setConfirmTarget({ action: "delete", id, name })}
        />
      </div>

      <Modal
        open={showAddModal}
        onClose={() => {
          resetForm();
          setShowAddModal(false);
        }}
        title="Add Category"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Category Name"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Freelance, Investments, Software, Dining"
            required
          />
          <Select
            label="Category Type"
            value={newKind}
            onChange={(e) => setNewKind(e.target.value as typeof newKind)}
            options={[
              { value: "expense", label: "Expense" },
              { value: "income", label: "Income" },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                resetForm();
                setShowAddModal(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Adding..." : "Add Category"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showEditModal}
        onClose={() => {
          resetForm();
          setShowEditModal(false);
          setEditCategory(null);
        }}
        title="Edit Category"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Category Name"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                resetForm();
                setShowEditModal(false);
                setEditCategory(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmTarget}
        title={confirmTarget?.action === "delete" ? "Delete Category" : "Archive Category"}
        message={
          confirmTarget?.action === "delete"
            ? `Are you sure you want to permanently delete category "${confirmTarget?.name}"?`
            : `Are you sure you want to archive category "${confirmTarget?.name}"?`
        }
        confirmLabel={confirmTarget?.action === "delete" ? "Delete" : "Archive"}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={async () => {
          if (!confirmTarget) return;
          if (confirmTarget.action === "delete") {
            await handleDelete(confirmTarget.id, confirmTarget.name);
          } else {
            await handleArchive(confirmTarget.id, confirmTarget.name);
          }
          setConfirmTarget(null);
        }}
      />
    </div>
  );
}
