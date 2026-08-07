import { useEffect, useState } from "react";
import { cn } from "../../lib/utils.js";

export function getRelativeTimeString(date: Date | string | number): string {
  const time = new Date(date).getTime();
  const now = Date.now();
  const diffInSeconds = Math.floor((now - time) / 1000);

  if (diffInSeconds < 60) return "Just now";

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y ago`;
}

interface RelativeTimeProps {
  date: Date | string | number;
  className?: string;
}

export function RelativeTime({ date, className }: RelativeTimeProps) {
  const [str, setStr] = useState(() => getRelativeTimeString(date));

  useEffect(() => {
    const interval = setInterval(() => {
      setStr(getRelativeTimeString(date));
    }, 60000);
    return () => clearInterval(interval);
  }, [date]);

  return <span className={cn("text-muted text-xs", className)}>{str}</span>;
}
