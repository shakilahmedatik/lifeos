import type { SkillArea } from "./types";

interface CategoryCardProps {
  category: SkillArea;
  resourceCount: number;
  onEdit: (category: SkillArea) => void;
  onDelete: (id: string) => void;
}

export default function CategoryCard({
  category,
  resourceCount,
  onEdit,
  onDelete,
}: CategoryCardProps) {
  return (
    <div className="p-4 bg-gray-800/40 border border-gray-700/50 rounded-xl hover:border-gray-600/50 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-gray-200">{category.name}</h3>
          <p className="text-xs text-gray-500 mt-1">
            {resourceCount} {resourceCount === 1 ? "resource" : "resources"}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onEdit(category)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-900/20 transition-colors text-xs"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(category.id)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors text-xs"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
