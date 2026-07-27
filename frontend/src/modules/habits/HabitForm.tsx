import type { Habit, NewHabitInput } from "@lifeos/contracts";
import { useState } from "react";

interface HabitFormProps {
  habit?: Habit;
  onSubmit: (input: NewHabitInput) => void;
  onCancel: () => void;
}

export default function HabitForm({ habit, onSubmit, onCancel }: HabitFormProps) {
  const [name, setName] = useState(habit?.name ?? "");
  const [frequency, setFrequency] = useState<Habit["frequency"]>(habit?.frequency ?? "daily");
  const [category, setCategory] = useState<Habit["category"]>(habit?.category ?? "general");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, frequency, category });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 bg-white rounded-lg border border-gray-200"
    >
      <div>
        <label htmlFor="habit-name" className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          id="habit-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label htmlFor="habit-frequency" className="block text-sm font-medium text-gray-700 mb-1">
          Frequency
        </label>
        <select
          id="habit-frequency"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as Habit["frequency"])}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>
      <div>
        <label htmlFor="habit-category" className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          id="habit-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as Habit["category"])}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="health">Health</option>
          <option value="learning">Learning</option>
          <option value="productivity">Productivity</option>
          <option value="mindfulness">Mindfulness</option>
          <option value="fitness">Fitness</option>
          <option value="general">General</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          {habit ? "Update" : "Create"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
