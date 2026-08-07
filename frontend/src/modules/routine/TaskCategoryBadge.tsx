import type { TaskCategory } from "@lifeos/contracts";

interface TaskCategoryBadgeProps {
  category: TaskCategory;
  className?: string;
}

export const CATEGORY_COLORS: Record<
  TaskCategory,
  { bg: string; text: string; border: string; borderLeft: string }
> = {
  work: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
    borderLeft: "border-l-blue-500",
  },
  workout: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/20",
    borderLeft: "border-l-red-500",
  },
  learning: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/20",
    borderLeft: "border-l-purple-500",
  },
  habit: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/20",
    borderLeft: "border-l-orange-500",
  },
  personal: {
    bg: "bg-pink-500/10",
    text: "text-pink-400",
    border: "border-pink-500/20",
    borderLeft: "border-l-pink-500",
  },
  routine: {
    bg: "bg-teal-500/10",
    text: "text-teal-400",
    border: "border-teal-500/20",
    borderLeft: "border-l-teal-500",
  },
  must_do: {
    bg: "bg-red-600/10",
    text: "text-red-300",
    border: "border-red-600/20",
    borderLeft: "border-l-red-600",
  },
  flex: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-400",
    border: "border-indigo-500/20",
    borderLeft: "border-l-indigo-500",
  },
  general: {
    bg: "bg-card0/10",
    text: "text-secondary",
    border: "border-border-subtle/20",
    borderLeft: "border-l-gray-500",
  },
};

export default function TaskCategoryBadge({ category, className = "" }: TaskCategoryBadgeProps) {
  const style = CATEGORY_COLORS[category] || CATEGORY_COLORS.general;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${style.bg} ${style.text} ${style.border} ${className}`}
    >
      {category.charAt(0).toUpperCase() + category.slice(1)}
    </span>
  );
}
