import { useState } from "react";
import type { CourseProgress, NewCourseProgressInput } from "./types";

interface CourseFormProps {
  course?: CourseProgress;
  onSubmit: (input: NewCourseProgressInput) => void;
  onCancel: () => void;
}

export default function CourseForm({ course, onSubmit, onCancel }: CourseFormProps) {
  const [name, setName] = useState(course?.name ?? "");
  const [platform, setPlatform] = useState(course?.platform ?? "");
  const [totalLessons, setTotalLessons] = useState(course?.totalLessons ?? 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, platform, totalLessons });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 bg-white rounded-lg border border-gray-200"
    >
      <div>
        <label htmlFor="course-name" className="block text-sm font-medium text-gray-700 mb-1">
          Course Name
        </label>
        <input
          id="course-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label htmlFor="course-platform" className="block text-sm font-medium text-gray-700 mb-1">
          Platform
        </label>
        <input
          id="course-platform"
          type="text"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Coursera, Udemy, YouTube"
          required
        />
      </div>
      <div>
        <label htmlFor="course-lessons" className="block text-sm font-medium text-gray-700 mb-1">
          Total Lessons
        </label>
        <input
          id="course-lessons"
          type="number"
          min="1"
          value={totalLessons}
          onChange={(e) => setTotalLessons(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          {course ? "Update" : "Add Course"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
