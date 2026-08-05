import type { HabitDefinition, HabitLogEntry } from "@lifeos/contracts";
import type React from "react";
import { useEffect, useState } from "react";
import Card, { CardContent } from "../../../components/ui/Card.js";
import { Select } from "../../../components/ui/Select.js";
import { habitApi } from "../api.js";

export function HabitHistory({ habits }: { habits: HabitDefinition[] }) {
  const [selectedHabitId, setSelectedHabitId] = useState<string>(habits[0]?.id || "");
  const [logs, setLogs] = useState<HabitLogEntry[]>([]);
  const [dateStr, setDateStr] = useState<string>(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (!selectedHabitId || !dateStr) return;
    habitApi.getLogs(selectedHabitId, dateStr).then(setLogs).catch(console.error);
  }, [selectedHabitId, dateStr]);

  const selectOptions = habits.map((h) => ({
    value: h.id,
    label: `${h.icon || "📌"} ${h.name}`,
  }));

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center">
        {selectOptions.length > 0 && (
          <div className="w-64">
            <Select
              value={selectedHabitId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSelectedHabitId(e.target.value)
              }
              options={selectOptions}
            />
          </div>
        )}
        <input
          type="date"
          value={dateStr}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateStr(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200"
        />
      </div>

      <div className="space-y-2">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-gray-900/30 rounded-xl border border-gray-800">
            No logs found for this date.
          </div>
        ) : (
          logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <span className="font-medium text-gray-200">{log.value}</span>
                  {log.meta && <span className="ml-2 text-sm text-gray-400">({log.meta})</span>}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(log.loggedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
