import { useState } from "react";
import type { NewWorkoutInput } from "../../../packages/contracts/src/index.js";
import { useAppToast } from "../components/Toast.js";
import Badge from "../components/ui/Badge.js";
import Button from "../components/ui/Button.js";
import Card, { CardHeader, CardTitle } from "../components/ui/Card.js";
import Modal from "../components/ui/Modal.js";
import { DumbbellIcon, PlusIcon } from "../components/ui/icons.js";
import { useWorkouts } from "../modules/workouts/useWorkouts.js";

export default function WorkoutsPage() {
  const { workouts, loading, createWorkout, deleteWorkout } = useWorkouts();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const toast = useAppToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const input: NewWorkoutInput = {
        name: name.trim(),
        description: description.trim() || undefined,
      };
      await createWorkout(input);
      toast.success("Workout created");
      setName("");
      setDescription("");
      setShowForm(false);
    } catch {
      toast.error("Failed to create workout");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Workouts</h1>
          <p className="text-sm text-gray-500 mt-1">Track your training</p>
        </div>
        <Button size="sm" icon={<PlusIcon size={14} />} onClick={() => setShowForm(true)}>
          New Workout
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-gray-800/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : workouts.length === 0 ? (
        <Card className="text-center py-8">
          <DumbbellIcon size={32} className="text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No workouts yet</p>
          <Button
            variant="secondary"
            size="sm"
            icon={<PlusIcon size={14} />}
            onClick={() => setShowForm(true)}
            className="mt-3"
          >
            Create your first workout
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {workouts.map((w) => (
            <Card key={w.id} hover className="border-l-red-500/50">
              <CardHeader>
                <CardTitle>{w.name}</CardTitle>
                <button
                  onClick={async () => {
                    try {
                      await deleteWorkout(w.id);
                      toast.success("Workout deleted");
                    } catch {
                      toast.error("Failed to delete workout");
                    }
                  }}
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
              </CardHeader>
              {w.description && <p className="text-xs text-gray-500">{w.description}</p>}
              {w.scheduledDay && (
                <Badge variant="default" size="sm" className="mt-2 capitalize">
                  {w.scheduledDay}
                </Badge>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Workout">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-500"
              placeholder="e.g. Upper Body"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-500 resize-none"
              placeholder="Optional description"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
