import CategoryCard from "./CategoryCard";
import type { SkillArea } from "./types";

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
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm">No skill areas yet.</p>
        <p className="text-xs text-gray-600 mt-1">Create your first area to organize learning!</p>
      </div>
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
