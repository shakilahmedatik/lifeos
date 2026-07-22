import { useCallback, useEffect, useState } from "react";
import { createCourse, deleteCourse, getCourses, updateCourse } from "./storage";
import type { CourseProgress, NewCourseProgressInput } from "./types";

export function useCourseProgress() {
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCourses = useCallback(() => {
    setLoading(true);
    const data = getCourses();
    setCourses(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const addCourse = useCallback((input: NewCourseProgressInput) => {
    const newCourse = createCourse(input);
    setCourses((prev) => [newCourse, ...prev]);
    return newCourse;
  }, []);

  const editCourse = useCallback(
    (id: string, patch: Partial<NewCourseProgressInput & { completionPercentage: number }>) => {
      const updated = updateCourse(id, patch);
      if (updated) {
        setCourses((prev) => prev.map((c) => (c.id === id ? updated : c)));
      }
      return updated;
    },
    [],
  );

  const removeCourse = useCallback((id: string) => {
    const success = deleteCourse(id);
    if (success) {
      setCourses((prev) => prev.filter((c) => c.id !== id));
    }
    return success;
  }, []);

  const updateProgress = useCallback(
    (id: string, percentage: number) => {
      const clampedPercentage = Math.min(100, Math.max(0, percentage));
      return editCourse(id, { completionPercentage: clampedPercentage });
    },
    [editCourse],
  );

  return {
    courses,
    loading,
    addCourse,
    editCourse,
    removeCourse,
    updateProgress,
    refresh: loadCourses,
  };
}
