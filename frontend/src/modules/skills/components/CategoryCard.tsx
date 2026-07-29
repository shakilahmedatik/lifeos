import { Edit, Trash2 } from "lucide-react";
import Button from "../../../components/ui/Button.js";
import Card from "../../../components/ui/Card.js";
import type { SkillArea } from "../types.js";

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
    <Card className="hover:border-gray-600/50 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-gray-200">{category.name}</h3>
          <p className="text-xs text-gray-500 mt-1">
            {resourceCount} {resourceCount === 1 ? "resource" : "resources"}
          </p>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(category)}
            icon={<Edit size={14} />}
            title="Edit"
          />
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(category.id)}
            icon={<Trash2 size={14} />}
            title="Delete"
          />
        </div>
      </div>
    </Card>
  );
}
