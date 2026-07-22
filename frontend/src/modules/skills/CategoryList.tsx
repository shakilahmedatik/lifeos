import CategoryCard from "./CategoryCard";
import type { LearningSession, SkillCategory } from "./types";

interface CategoryListProps {
  categories: SkillCategory[];
  sessions: LearningSession[];
  onEdit: (category: SkillCategory) => void;
  onDelete: (id: string) => void;
}

export default function CategoryList({
  categories,
  sessions,
  onEdit,
  onDelete,
}: CategoryListProps) {
  const getSessionCount = (categoryId: string) =>
    sessions.filter((s) => s.skillCategoryId === categoryId).length;

  if (categories.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No skill categories yet.</p>
        <p className="text-sm text-gray-400 mt-1">
          Create your first category to organize learning activities!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          sessionCount={getSessionCount(category.id)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
