import type { Habit, HabitCategory, NewHabitInput } from "@lifeos/contracts";
import { getClientDateString } from "@lifeos/contracts";
import { useState } from "react";
import { useAppToast } from "../components/Toast.js";
import Badge from "../components/ui/Badge.js";
import Button from "../components/ui/Button.js";
import Card, { CardHeader, CardTitle } from "../components/ui/Card.js";
import Modal from "../components/ui/Modal.js";
import { CheckCheckIcon, PlusIcon } from "../components/ui/icons.js";
import { useHabits } from "../modules/habits/useHabits.js";

const CATEGORY_VARIANTS: Record<
  HabitCategory,
  "blue" | "purple" | "orange" | "pink" | "success" | "default"
> = {
  health: "success",
  learning: "purple",
  productivity: "blue",
  mindfulness: "pink",
  fitness: "orange",
  general: "default",
};

export default function HabitsPage() {
  const { habits, loading, addHabit, removeHabit, toggleHabit } = useHabits();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [category, setCategory] = useState<HabitCategory>("general");
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const toast = useAppToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const input: NewHabitInput = { name: name.trim(), frequency, category };
      await addHabit(input);
      setName("");
      setShowForm(false);
    } catch {
      toast.error("Failed to create habit");
    }
  };

  const handleToggle = async (habitId: string, currentlyLogged: boolean) => {
    const today = getClientDateString();
    try {
      await toggleHabit(habitId, today, currentlyLogged);
    } catch {
      toast.error("Failed to update habit");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Habits</h1>
          <p className="text-sm text-gray-500 mt-1">Build daily routines</p>
        </div>
        <Button size="sm" icon={<PlusIcon size={14} />} onClick={() => setShowForm(true)}>
          Add Habit
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-800/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : habits.length === 0 ? (
        <Card className="text-center py-8">
          <CheckCheckIcon size={32} className="text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No habits yet</p>
          <Button
            variant="secondary"
            size="sm"
            icon={<PlusIcon size={14} />}
            onClick={() => setShowForm(true)}
            className="mt-3"
          >
            Create your first habit
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {habits.map((habit) => (
            <Card key={habit.id} hover padding="md">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-600" />
                    <span className="text-sm font-medium text-gray-200 truncate">{habit.name}</span>
                    <Badge variant={CATEGORY_VARIANTS[habit.category]} size="sm">
                      {habit.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5 capitalize">{habit.frequency}</p>
                </div>
                <div className="flex items-center gap-1 ml-3">
                  <button
                    onClick={() => handleToggle(habit.id, false)}
                    className="px-3 py-1 rounded-lg text-xs font-medium transition-all bg-gray-700/50 text-gray-400 border border-gray-600/50 hover:bg-gray-700"
                  >
                    Log
                  </button>
                  <button
                    onClick={() => removeHabit(habit.id)}
                    className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-900/30 transition-colors"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Habit">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-500"
              placeholder="e.g. Morning walk"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as "daily" | "weekly")}
                className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as HabitCategory)}
                className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
              >
                <option value="general">General</option>
                <option value="health">Health</option>
                <option value="learning">Learning</option>
                <option value="productivity">Productivity</option>
                <option value="mindfulness">Mindfulness</option>
                <option value="fitness">Fitness</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Habit</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
