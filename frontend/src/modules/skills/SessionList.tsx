import SessionCard from "./SessionCard";
import type { LearningLog, LearningResource } from "./types";

interface SessionListProps {
  logs: LearningLog[];
  resources: LearningResource[];
  onEdit: (log: LearningLog) => void;
  onDelete: (id: string) => void;
}

export default function SessionList({ logs, resources, onEdit, onDelete }: SessionListProps) {
  const getResourceById = (id: string) => resources.find((r) => r.id === id);

  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm">No learning sessions yet.</p>
        <p className="text-xs text-gray-600 mt-1">Log your first session to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <SessionCard
          key={log.id}
          log={log}
          resource={getResourceById(log.resourceId)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
