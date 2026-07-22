import type { SkillCategory } from "./types";

interface CategoryCardProps {
  category: SkillCategory;
  sessionCount: number;
  onEdit: (category: SkillCategory) => void;
  onDelete: (id: string) => void;
}

export default function CategoryCard({
  category,
  sessionCount,
  onEdit,
  onDelete,
}: CategoryCardProps) {
  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
          {category.description && (
            <p className="text-sm text-gray-500 mt-1">{category.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            {sessionCount} {sessionCount === 1 ? "session" : "sessions"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(category)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(category.id)}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
