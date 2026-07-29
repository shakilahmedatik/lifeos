import { Folder } from "lucide-react";
import EmptyState from "../../../components/ui/EmptyState.js";
import type { SkillArea } from "../types.js";
import CategoryCard from "./CategoryCard.js";

interface CategoryListProps {
  categories: SkillArea[];
  resourceCounts: Record<string, number>;
  onEdit: (category: SkillArea) => void;
  onDelete: (id: string) => void;
}

export default function CategoryList({
  categories,
  resourceCounts,
  onEdit,
  onDelete,
}: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <EmptyState
        icon={Folder}
        title="No skill areas yet."
        description="Create your first area to organize learning!"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          resourceCount={resourceCounts[category.id] ?? 0}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
