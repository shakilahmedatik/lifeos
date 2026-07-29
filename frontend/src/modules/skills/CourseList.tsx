import CourseCard from "./CourseCard";
import type { LearningResource, ResourceWithProgress } from "./types";

interface CourseListProps {
  resources: LearningResource[];
  progresses: Record<string, ResourceWithProgress | null>;
  onEdit: (resource: LearningResource) => void;
  onDelete: (id: string) => void;
}

export default function CourseList({ resources, progresses, onEdit, onDelete }: CourseListProps) {
  if (resources.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm">No learning resources yet.</p>
        <p className="text-xs text-gray-600 mt-1">Add your first resource to track progress!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {resources.map((resource) => (
        <CourseCard
          key={resource.id}
          resource={resource}
          progress={progresses[resource.id] ?? null}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
