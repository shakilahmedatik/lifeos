import { getClientDateString, type HabitDefinition, type HabitLogEntry } from "@lifeos/contracts";
import { Trash2 } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import Card, { CardContent } from "../../../components/ui/Card.js";
import { Select } from "../../../components/ui/Select.js";
import { habitApi } from "../api.js";

export function HabitHistory({ habits }: { habits: HabitDefinition[] }) {
  const [selectedHabitId, setSelectedHabitId] = useState<string>(habits[0]?.id || "");
  const [logs, setLogs] = useState<HabitLogEntry[]>([]);
  const [dateStr, setDateStr] = useState<string>(() => getClientDateString());

  useEffect(() => {
    if (habits.length > 0 && (!selectedHabitId || !habits.some((h) => h.id === selectedHabitId))) {
      setSelectedHabitId(habits[0].id);
    }
  }, [habits, selectedHabitId]);

  const loadLogs = useCallback(async () => {
    if (!selectedHabitId || !dateStr) return;
    try {
      const data = await habitApi.getLogs(selectedHabitId, dateStr);
      setLogs(data);
    } catch (err) {
      console.error(err);
    }
  }, [selectedHabitId, dateStr]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleDeleteLog = async (logId: string) => {
    try {
      await habitApi.removeLog(logId);
      await loadLogs();
    } catch (err) {
      console.error(err);
    }
  };

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
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>
                    {new Date(log.loggedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteLog(log.id)}
                    title="Delete log"
                    className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
