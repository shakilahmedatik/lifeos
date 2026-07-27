import { useState } from "react";
import type { NewTaskInput } from "../../../../packages/contracts/src/index.js";
import { getClientDateString } from "../../../../packages/contracts/src/index.js";

interface TaskFormProps {
  onSubmit: (input: NewTaskInput) => void;
  defaultDate?: string;
}

export default function TaskForm({ onSubmit, defaultDate }: TaskFormProps) {
  const today = defaultDate ?? getClientDateString();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<NewTaskInput["category"]>("general");
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      category,
      date,
      startTime,
      endTime,
      notes: notes.trim() || undefined,
    });

    setTitle("");
    setNotes("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-gray-800 rounded-lg">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        className="w-full bg-gray-700 text-gray-100 rounded px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
        required
      />
      <div className="grid grid-cols-2 gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as NewTaskInput["category"])}
          className="bg-gray-700 text-gray-300 rounded px-3 py-2 border border-gray-600"
        >
          <option value="general">General</option>
          <option value="work">Work</option>
          <option value="workout">Workout</option>
          <option value="learning">Learning</option>
          <option value="habit">Habit</option>
          <option value="personal">Personal</option>
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-gray-700 text-gray-300 rounded px-3 py-2 border border-gray-600"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="task-start" className="text-xs text-gray-400 mb-1 block">
            Start
          </label>
          <input
            id="task-start"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full bg-gray-700 text-gray-300 rounded px-3 py-2 border border-gray-600"
          />
        </div>
        <div>
          <label htmlFor="task-end" className="text-xs text-gray-400 mb-1 block">
            End
          </label>
          <input
            id="task-end"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full bg-gray-700 text-gray-300 rounded px-3 py-2 border border-gray-600"
          />
        </div>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        rows={2}
        className="w-full bg-gray-700 text-gray-300 rounded px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
      />
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded transition-colors"
      >
        Add Task
      </button>
    </form>
  );
}
