import { Plus } from "lucide-react";
import { useState } from "react";
import Button from "../../../components/ui/Button.js";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog.js";
import Modal from "../../../components/ui/Modal.js";
import type { NewSkillAreaInput, SkillArea } from "../types.js";
import CategoryForm from "./CategoryForm.js";
import CategoryList from "./CategoryList.js";

interface CategoriesTabProps {
  areas: SkillArea[];
  resourceCounts: Record<string, number>;
  onAddArea: (input: NewSkillAreaInput) => Promise<unknown>;
  onEditArea: (id: string, input: NewSkillAreaInput) => Promise<unknown>;
  onRemoveArea: (id: string) => Promise<unknown>;
}

export function CategoriesTab({
  areas,
  resourceCounts,
  onAddArea,
  onEditArea,
  onRemoveArea,
}: CategoriesTabProps) {
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SkillArea | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(
    null,
  );

  const handleCategorySubmit = async (input: NewSkillAreaInput) => {
    if (editingCategory) {
      await onEditArea(editingCategory.id, input);
      setEditingCategory(null);
    } else {
      await onAddArea(input);
    }
    setShowCategoryForm(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation) return;
    await onRemoveArea(deleteConfirmation.id);
    setDeleteConfirmation(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-primary">Skill Areas</h2>
        <Button
          icon={<Plus size={16} />}
          onClick={() => {
            setEditingCategory(null);
            setShowCategoryForm(true);
          }}
        >
          Create Area
        </Button>
      </div>

      <Modal
        open={showCategoryForm}
        onClose={() => {
          setShowCategoryForm(false);
          setEditingCategory(null);
        }}
        title={editingCategory ? "Edit Skill Area" : "Create Skill Area"}
      >
        <CategoryForm
          category={editingCategory ?? undefined}
          onSubmit={handleCategorySubmit}
          onCancel={() => {
            setShowCategoryForm(false);
            setEditingCategory(null);
          }}
        />
      </Modal>

      <CategoryList
        categories={areas}
        resourceCounts={resourceCounts}
        onEdit={(category) => {
          setEditingCategory(category);
          setShowCategoryForm(true);
        }}
        onDelete={(id) => {
          const category = areas.find((a) => a.id === id);
          setDeleteConfirmation({
            id,
            name: category?.name ?? "Area",
          });
        }}
      />

      {deleteConfirmation && (
        <ConfirmDialog
          open={!!deleteConfirmation}
          title="Delete area"
          message={`Are you sure you want to delete "${deleteConfirmation.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirmation(null)}
        />
      )}
    </div>
  );
}

export default CategoriesTab;
