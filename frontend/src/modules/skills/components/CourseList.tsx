import { BookOpen } from "lucide-react";
import EmptyState from "../../../components/ui/EmptyState.js";
import type { LearningResource, ResourceWithProgress } from "../types.js";
import CourseCard from "./CourseCard.js";

interface CourseListProps {
  resources: LearningResource[];
  progresses: Record<string, ResourceWithProgress | null>;
  onEdit: (resource: LearningResource) => void;
  onDelete: (id: string) => void;
}

export default function CourseList({ resources, progresses, onEdit, onDelete }: CourseListProps) {
  if (resources.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No learning resources yet."
        description="Add your first resource to track progress!"
      />
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
