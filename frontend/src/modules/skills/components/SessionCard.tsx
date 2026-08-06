import { Edit, Trash2 } from "lucide-react";
import Button from "../../../components/ui/Button.js";
import Card from "../../../components/ui/Card.js";
import type { LearningLog, LearningResource } from "../types.js";
import { formatLocalDate } from "../utils/date-utils.js";

interface SessionCardProps {
  log: LearningLog;
  resource?: LearningResource;
  onEdit: (log: LearningLog) => void;
  onDelete: (id: string) => void;
}

export default function SessionCard({ log, resource, onEdit, onDelete }: SessionCardProps) {
  const formatDate = (dateStr: string) => {
    return formatLocalDate(dateStr, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card padding="sm" className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-200">{log.minutesSpent} min</span>
          {resource && (
            <span className="px-2 py-0.5 text-xs bg-blue-600/20 text-blue-400 rounded-full border border-blue-500/20">
              {resource.title}
            </span>
          )}
        </div>
        {log.notes && <p className="text-xs text-gray-500 mt-0.5 truncate">{log.notes}</p>}
        <p className="text-xs text-gray-600 mt-0.5">{formatDate(log.date)}</p>
      </div>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(log)}
          icon={<Edit size={14} />}
          title="Edit"
        />
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(log.id)}
          icon={<Trash2 size={14} />}
          title="Delete"
        />
      </div>
    </Card>
  );
}
