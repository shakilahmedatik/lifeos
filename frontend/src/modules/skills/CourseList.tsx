import CourseCard from "./CourseCard";
import type { CourseProgress } from "./types";

interface CourseListProps {
  courses: CourseProgress[];
  onEdit: (course: CourseProgress) => void;
  onDelete: (id: string) => void;
  onUpdateProgress: (id: string, percentage: number) => void;
}

export default function CourseList({
  courses,
  onEdit,
  onDelete,
  onUpdateProgress,
}: CourseListProps) {
  if (courses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No courses enrolled yet.</p>
        <p className="text-sm text-gray-400 mt-1">Add your first course to track progress!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateProgress={onUpdateProgress}
        />
      ))}
    </div>
  );
}
