import type { Task } from "@lifeos/contracts";
import { useEffect, useState } from "react";

interface NowCardProps {
  task: Task | null;
}

function formatCountdown(endTime: string): string {
  const now = new Date();
  const [endH, endM] = endTime.split(":").map(Number);
  const endDate = new Date(now);
  endDate.setHours(endH, endM, 0, 0);

  const diff = endDate.getTime() - now.getTime();
  if (diff <= 0) return "00:00:00";

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function NowCard({ task }: NowCardProps) {
  const [countdown, setCountdown] = useState(task ? formatCountdown(task.endTime) : "");

  useEffect(() => {
    if (!task) return;

    const tick = () => setCountdown(formatCountdown(task.endTime));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [task]);

  if (!task) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Now</div>
        <div className="text-gray-400">No active task</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-blue-500/50">
      <div className="text-xs text-blue-400 uppercase tracking-wide mb-1">Now</div>
      <div className="font-semibold text-gray-100 text-lg">{task.title}</div>
      <div className="text-sm text-gray-400 mt-1">
        {task.startTime} – {task.endTime}
      </div>
      <div className="text-2xl font-mono text-blue-400 mt-2">{countdown}</div>
    </div>
  );
}
