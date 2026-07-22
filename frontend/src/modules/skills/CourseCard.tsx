import type { CourseProgress } from "./types";

interface CourseCardProps {
  course: CourseProgress;
  onEdit: (course: CourseProgress) => void;
  onDelete: (id: string) => void;
  onUpdateProgress: (id: string, percentage: number) => void;
}

export default function CourseCard({
  course,
  onEdit,
  onDelete,
  onUpdateProgress,
}: CourseCardProps) {
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{course.name}</h3>
          <p className="text-sm text-gray-500">{course.platform}</p>
          <div className="mt-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{course.completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${course.completionPercentage}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Last accessed: {formatDate(course.lastAccessedAt)}
          </p>
        </div>
        <div className="flex flex-col gap-2 ml-4">
          <input
            type="number"
            min="0"
            max="100"
            value={course.completionPercentage}
            onChange={(e) => onUpdateProgress(course.id, Number(e.target.value))}
            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => onEdit(course)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(course.id)}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
