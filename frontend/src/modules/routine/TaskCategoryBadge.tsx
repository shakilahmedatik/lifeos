import type { RoutineCategory, TaskCategory } from "@lifeos/contracts";

interface TaskCategoryBadgeProps {
  category: TaskCategory | string;
  categoryObj?: RoutineCategory;
  categories?: RoutineCategory[];
  className?: string;
  showIcon?: boolean;
}

export const CATEGORY_COLORS: Record<
  string,
  { bg: string; text: string; border: string; borderLeft: string; hex: string }
> = {
  work: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
    borderLeft: "border-l-blue-500",
    hex: "#3b82f6",
  },
  workout: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/20",
    borderLeft: "border-l-red-500",
    hex: "#ef4444",
  },
  learning: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/20",
    borderLeft: "border-l-purple-500",
    hex: "#a855f7",
  },
  habit: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/20",
    borderLeft: "border-l-orange-500",
    hex: "#f97316",
  },
  personal: {
    bg: "bg-pink-500/10",
    text: "text-pink-400",
    border: "border-pink-500/20",
    borderLeft: "border-l-pink-500",
    hex: "#ec4899",
  },
  routine: {
    bg: "bg-teal-500/10",
    text: "text-teal-400",
    border: "border-teal-500/20",
    borderLeft: "border-l-teal-500",
    hex: "#14b8a6",
  },
  must_do: {
    bg: "bg-red-600/10",
    text: "text-red-300",
    border: "border-red-600/20",
    borderLeft: "border-l-red-600",
    hex: "#dc2626",
  },
  flex: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-400",
    border: "border-indigo-500/20",
    borderLeft: "border-l-indigo-500",
    hex: "#6366f1",
  },
  general: {
    bg: "bg-card0/10",
    text: "text-secondary",
    border: "border-border-subtle/20",
    borderLeft: "border-l-gray-500",
    hex: "#6b7280",
  },
};

function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace("#", "");
  if (cleanHex.length !== 6) return hex;
  const r = Number.parseInt(cleanHex.substring(0, 2), 16);
  const g = Number.parseInt(cleanHex.substring(2, 4), 16);
  const b = Number.parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function formatCategoryName(cat: string): string {
  if (!cat) return "General";
  // Replace underscores with spaces and capitalize each word
  return cat
    .split(/[_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default function TaskCategoryBadge({
  category,
  categoryObj,
  categories,
  className = "",
  showIcon = true,
}: TaskCategoryBadgeProps) {
  // Find matched category object if not directly supplied
  const matchedCat =
    categoryObj ||
    categories?.find(
      (c) =>
        c.id === category ||
        c.name.toLowerCase() === category?.toLowerCase() ||
        c.id.toLowerCase() === category?.toLowerCase(),
    );

  const rawKey = category ? category.toLowerCase().replace(/\s+/g, "_") : "general";
  const standardStyle = CATEGORY_COLORS[rawKey] || CATEGORY_COLORS[category];

  const displayName = matchedCat?.name || formatCategoryName(category || "general");
  const customColor = matchedCat?.color;
  const icon = matchedCat?.icon;

  if (customColor?.startsWith("#")) {
    const bgStyle = hexToRgba(customColor, 0.12);
    const borderStyle = hexToRgba(customColor, 0.28);
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border transition-colors ${className}`}
        style={{
          backgroundColor: bgStyle,
          borderColor: borderStyle,
          color: customColor,
        }}
      >
        {showIcon && icon && <span className="text-[11px] leading-none">{icon}</span>}
        <span>{displayName}</span>
      </span>
    );
  }

  const style = standardStyle || CATEGORY_COLORS.general;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${style.bg} ${style.text} ${style.border} ${className}`}
    >
      {showIcon && icon && <span className="text-[11px] leading-none">{icon}</span>}
      <span>{displayName}</span>
    </span>
  );
}
