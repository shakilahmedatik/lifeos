import type { LearningResource, ResourceWithProgress } from "./types";

interface CourseCardProps {
  resource: LearningResource;
  progress: ResourceWithProgress | null;
  onEdit: (resource: LearningResource) => void;
  onDelete: (id: string) => void;
}

export default function CourseCard({ resource, progress, onEdit, onDelete }: CourseCardProps) {
  const completionPercent = progress?.completionPercent ?? 0;

  if (!progress) {
    return (
      <div className="p-4 bg-gray-800/40 border border-gray-700/50 rounded-xl hover:border-gray-600/50 transition-colors">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-200 truncate">{resource.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 text-xs bg-purple-600/20 text-purple-400 rounded-full border border-purple-500/20 capitalize">
                {resource.type}
              </span>
              <span className="text-xs text-gray-500">Loading...</span>
            </div>
          </div>
          <div className="flex gap-1 ml-2">
            <button
              type="button"
              onClick={() => onEdit(resource)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-900/20 transition-colors text-xs"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(resource.id)}
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
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800/40 border border-gray-700/50 rounded-xl hover:border-gray-600/50 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-200 truncate">{resource.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 text-xs bg-purple-600/20 text-purple-400 rounded-full border border-purple-500/20 capitalize">
              {resource.type}
            </span>
            <span className="text-xs text-gray-500">{progress.totalMinutesSpent} min spent</span>
          </div>
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-400">{completionPercent}%</span>
            </div>
          </div>
        </div>
        <div className="flex gap-1 ml-2">
          <button
            type="button"
            onClick={() => onEdit(resource)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-900/20 transition-colors text-xs"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(resource.id)}
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
    </div>
  );
}
