import type { LearningSession, SkillCategory } from "./types";

interface SessionCardProps {
  session: LearningSession;
  category?: SkillCategory;
  onEdit: (session: LearningSession) => void;
  onDelete: (id: string) => void;
}

export default function SessionCard({ session, category, onEdit, onDelete }: SessionCardProps) {
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-semibold text-gray-900">{session.duration} min</span>
            {category && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {category.name}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{formatDate(session.timestamp)}</p>
          {session.notes && <p className="mt-2 text-sm text-gray-700">{session.notes}</p>}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(session)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(session.id)}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
