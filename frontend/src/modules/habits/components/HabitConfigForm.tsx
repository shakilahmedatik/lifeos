import type {
  HabitCategory,
  HabitConfig,
  HabitType,
  NewHabitDefinitionInput,
} from "@lifeos/contracts";
import { useState } from "react";
import Button from "../../../components/ui/Button.js";
import { Input } from "../../../components/ui/Input.js";
import { Select } from "../../../components/ui/Select.js";

interface HabitConfigFormProps {
  type: HabitType;
  initialData?: Partial<NewHabitDefinitionInput>;
  onSave: (data: NewHabitDefinitionInput) => void;
  onCancel: () => void;
}

export function HabitConfigForm({ type, initialData, onSave, onCancel }: HabitConfigFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [category, setCategory] = useState<HabitCategory>(initialData?.category || "general");
  const [icon, setIcon] = useState(initialData?.icon || "");
  const [color, _setColor] = useState(initialData?.color || "#10B981");
  const [config, setConfig] = useState<Record<string, unknown>>(() => {
    if (initialData?.config) return initialData.config as unknown as Record<string, unknown>;
    switch (type) {
      case "water":
        return {
          type: "water",
          dailyGoalMl: 2500,
          sessionPresetsMl: [250, 500],
          reminderIntervalMin: 120,
        };
      case "walking":
        return { type: "walking", dailyGoal: 10000, unit: "steps" };
      case "prayer":
        return {
          type: "prayer",
          prayers: [
            { name: "Fajr", time: "05:00" },
            { name: "Dhuhr", time: "13:00" },
            { name: "Asr", time: "16:30" },
            { name: "Maghrib", time: "19:00" },
            { name: "Isha", time: "20:30" },
          ],
        };
      case "timed":
        return { type: "timed", dailyGoalMinutes: 30 };
      case "boolean":
        return { type: "boolean" };
      default:
        return {};
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, type, category, icon, color, config: config as unknown as HabitConfig });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
        <Input
          required
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          placeholder="Habit name"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Icon (emoji)</label>
          <Input
            value={icon}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIcon(e.target.value)}
            placeholder="💧"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
          <Select
            value={category}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setCategory(e.target.value as HabitCategory)
            }
            options={[
              { value: "health", label: "Health" },
              { value: "fitness", label: "Fitness" },
              { value: "learning", label: "Learning" },
              { value: "productivity", label: "Productivity" },
              { value: "mindfulness", label: "Mindfulness" },
              { value: "general", label: "General" },
            ]}
          />
        </div>
      </div>

      {type === "water" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Daily Goal (ml)
              </label>
              <Input
                type="number"
                required
                value={(config.dailyGoalMl as number) ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setConfig({ ...config, dailyGoalMl: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Reminder Every (mins)
              </label>
              <Input
                type="number"
                value={(config.reminderIntervalMin as number) || 120}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setConfig({ ...config, reminderIntervalMin: Number(e.target.value) })
                }
                placeholder="120"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Preset Amounts (comma separated, ml)
            </label>
            <Input
              value={((config.sessionPresetsMl as number[]) || []).join(", ")}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const presets = e.target.value
                  .split(",")
                  .map((s) => Number(s.trim()))
                  .filter((n) => !Number.isNaN(n) && n > 0);
                setConfig({
                  ...config,
                  sessionPresetsMl: presets.length > 0 ? presets : [250, 500],
                });
              }}
              placeholder="150, 250, 500"
            />
          </div>
        </div>
      )}

      {type === "walking" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Daily Goal</label>
            <Input
              type="number"
              required
              value={(config.dailyGoal as number) ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setConfig({ ...config, dailyGoal: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Unit</label>
            <Select
              value={(config.unit as string) ?? "steps"}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setConfig({ ...config, unit: e.target.value })
              }
              options={[
                { value: "steps", label: "Steps" },
                { value: "km", label: "Km" },
              ]}
            />
          </div>
        </div>
      )}

      {type === "timed" && (
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Daily Goal (minutes)
          </label>
          <Input
            type="number"
            required
            value={(config.dailyGoalMinutes as number) ?? ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setConfig({ ...config, dailyGoalMinutes: Number(e.target.value) })
            }
          />
        </div>
      )}

      {type === "prayer" && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-400 mb-1">Prayers & Times</label>
          {((config.prayers as Array<{ name: string; time: string }>) || []).map((p, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={p.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const newP = [
                    ...((config.prayers as Array<{ name: string; time: string }>) || []),
                  ];
                  newP[i].name = e.target.value;
                  setConfig({ ...config, prayers: newP });
                }}
              />
              <Input
                type="time"
                value={p.time}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const newP = [
                    ...((config.prayers as Array<{ name: string; time: string }>) || []),
                  ];
                  newP[i].time = e.target.value;
                  setConfig({ ...config, prayers: newP });
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-3 mt-6">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Save Habit
        </Button>
      </div>
    </form>
  );
}
