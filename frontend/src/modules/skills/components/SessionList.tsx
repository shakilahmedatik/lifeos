import { History } from "lucide-react";
import EmptyState from "../../../components/ui/EmptyState.js";
import type { LearningLog, LearningResource } from "../types.js";
import SessionCard from "./SessionCard.js";

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
      <EmptyState
        icon={History}
        title="No learning sessions yet."
        description="Log your first session to get started!"
      />
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
