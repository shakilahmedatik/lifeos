import { Edit, Trash2 } from "lucide-react";
import Button from "../../../components/ui/Button.js";
import Card from "../../../components/ui/Card.js";
import type { LearningResource, ResourceWithProgress } from "../types.js";

interface CourseCardProps {
  resource: LearningResource;
  progress: ResourceWithProgress | null;
  onEdit: (resource: LearningResource) => void;
  onDelete: (id: string) => void;
}

export default function CourseCard({ resource, progress, onEdit, onDelete }: CourseCardProps) {
  const completionPercent = progress?.completionPercent ?? 0;

  return (
    <Card className="hover:border-gray-600/50 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-200 truncate">{resource.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 text-xs bg-purple-600/20 text-purple-400 rounded-full border border-purple-500/20 capitalize">
              {resource.type}
            </span>
            <span className="text-xs text-gray-500 ml-2">
              {progress ? `${progress.totalMinutesSpent} min spent` : "Loading..."}
            </span>
          </div>
          {progress && (
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-purple-500 to-purple-400 rounded-full transition-all"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-400">{completionPercent}%</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-1 ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(resource)}
            icon={<Edit size={14} />}
            title="Edit"
          />
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(resource.id)}
            icon={<Trash2 size={14} />}
            title="Delete"
          />
        </div>
      </div>
    </Card>
  );
}
