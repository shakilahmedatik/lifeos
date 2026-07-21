import type { DashboardSummary as DashboardSummaryType } from "../../../../packages/contracts/src/index.js";
import NextCard from "./NextCard.js";
import NowCard from "./NowCard.js";

interface DashboardSummaryProps {
  summary: DashboardSummaryType | null;
}

export default function DashboardSummary({ summary }: DashboardSummaryProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NowCard task={summary?.now ?? null} />
        <NextCard task={summary?.next ?? null} />
      </div>
      {summary && (
        <div className="text-center text-sm text-gray-500">
          {summary.todayDoneCount}/{summary.todayCount} tasks done today
        </div>
      )}
    </div>
  );
}
