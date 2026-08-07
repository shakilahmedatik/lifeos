import type {
  HabitCategory,
  HabitConfig,
  HabitType,
  NewHabitDefinitionInput,
} from "@lifeos/contracts";
import { useState } from "react";
import Button from "../../../components/ui/Button.js";
import { ColorPicker } from "../../../components/ui/ColorPicker.js";
import { FormField } from "../../../components/ui/FormField.js";
import { Input } from "../../../components/ui/Input.js";
import ModalFooter from "../../../components/ui/ModalFooter.js";
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
  const [color, setColor] = useState(initialData?.color || "#10B981");
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
      <FormField label="Name">
        <Input
          required
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          placeholder="Habit name"
        />
      </FormField>
      
      <FormField label="Color Theme">
        <ColorPicker value={color} onChange={setColor} />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Icon (emoji)">
          <Input
            value={icon}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIcon(e.target.value)}
            placeholder="💧"
          />
        </FormField>
        <FormField label="Category">
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
        </FormField>
      </div>

      {type === "water" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Daily Goal (ml)">
              <Input
                type="number"
                required
                value={(config.dailyGoalMl as number) ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setConfig({ ...config, dailyGoalMl: Number(e.target.value) })
                }
              />
            </FormField>
            <FormField label="Reminder Every (mins)">
              <Input
                type="number"
                value={(config.reminderIntervalMin as number) || 120}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setConfig({ ...config, reminderIntervalMin: Number(e.target.value) })
                }
                placeholder="120"
              />
            </FormField>
          </div>
          <FormField label="Preset Amounts (comma separated, ml)">
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
          </FormField>
        </div>
      )}

      {type === "walking" && (
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Daily Goal">
            <Input
              type="number"
              required
              value={(config.dailyGoal as number) ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setConfig({ ...config, dailyGoal: Number(e.target.value) })
              }
            />
          </FormField>
          <FormField label="Unit">
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
          </FormField>
        </div>
      )}

      {type === "timed" && (
        <FormField label="Daily Goal (minutes)">
          <Input
            type="number"
            required
            value={(config.dailyGoalMinutes as number) ?? ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setConfig({ ...config, dailyGoalMinutes: Number(e.target.value) })
            }
          />
        </FormField>
      )}

      {type === "prayer" && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-secondary mb-1">Prayers & Times</label>
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

      <ModalFooter>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Save Habit
        </Button>
      </ModalFooter>
    </form>
  );
}
