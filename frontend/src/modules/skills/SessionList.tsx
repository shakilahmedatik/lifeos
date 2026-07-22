import SessionCard from "./SessionCard";
import type { LearningSession, SkillCategory } from "./types";

interface SessionListProps {
  sessions: LearningSession[];
  categories: SkillCategory[];
  onEdit: (session: LearningSession) => void;
  onDelete: (id: string) => void;
}

export default function SessionList({ sessions, categories, onEdit, onDelete }: SessionListProps) {
  const getCategoryById = (id: string) => categories.find((c) => c.id === id);

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No learning sessions yet.</p>
        <p className="text-sm text-gray-400 mt-1">Log your first session to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          category={getCategoryById(session.skillCategoryId)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
