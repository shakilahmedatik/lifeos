import type { LearningLog, LearningResource } from "./types";

interface SessionCardProps {
  log: LearningLog;
  resource?: LearningResource;
  onEdit: (log: LearningLog) => void;
  onDelete: (id: string) => void;
}

export default function SessionCard({ log, resource, onEdit, onDelete }: SessionCardProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="p-3 bg-gray-800/40 border border-gray-700/50 rounded-xl flex items-center gap-3">
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
        <button
          type="button"
          onClick={() => onEdit(log)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-900/20 transition-colors text-xs"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(log.id)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
