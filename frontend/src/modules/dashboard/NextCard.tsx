import type { Task } from "@lifeos/contracts";

interface NextCardProps {
  task: Task | null;
}

export default function NextCard({ task }: NextCardProps) {
  if (!task) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Next</div>
        <div className="text-gray-400">No upcoming tasks</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Next</div>
      <div className="font-semibold text-gray-100">{task.title}</div>
      <div className="text-sm text-gray-400 mt-1">Starts at {task.startTime}</div>
    </div>
  );
}
