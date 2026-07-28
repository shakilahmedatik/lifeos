import type { EquipmentType, Exercise, MuscleGroup, NewExerciseInput } from "@lifeos/contracts";
import type React from "react";
import { useState } from "react";
import { useAppToast } from "../../components/Toast.js";
import Badge from "../../components/ui/Badge.js";
import Button from "../../components/ui/Button.js";
import Card, { CardContent } from "../../components/ui/Card.js";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog.js";
import { Input } from "../../components/ui/Input.js";
import { EditIcon, PlusIcon, SearchIcon, TrashIcon, VideoIcon } from "../../components/ui/icons.js";
import Modal from "../../components/ui/Modal.js";
import { Select } from "../../components/ui/Select.js";
import { useExercises } from "./useWorkouts.js";

const MUSCLE_GROUPS: (MuscleGroup | "all")[] = [
  "all",
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "legs",
  "core",
  "cardio",
  "general",
];

const EQUIPMENT_TYPES: EquipmentType[] = [
  "bodyweight",
  "dumbbell",
  "barbell",
  "machine",
  "cable",
  "other",
];

function formatLabel(str: string): string {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function ExerciseLibrary() {
  const { exercises, loading, error, createExercise, updateExercise, deleteExercise } =
    useExercises();
  const { success, error: showError } = useAppToast();

  const [search, setSearch] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | "all">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [deletingExerciseId, setDeletingExerciseId] = useState<string | null>(null);

  const [formData, setFormData] = useState<NewExerciseInput>({
    name: "",
    muscleGroup: "chest",
    equipment: "dumbbell",
    videoUrl: "",
  });

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle = selectedMuscle === "all" || ex.muscleGroup === selectedMuscle;
    return matchesSearch && matchesMuscle;
  });

  const handleOpenNew = () => {
    setEditingExercise(null);
    setFormData({
      name: "",
      muscleGroup: "chest",
      equipment: "dumbbell",
      videoUrl: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ex: Exercise) => {
    setEditingExercise(ex);
    setFormData({
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      equipment: ex.equipment || "dumbbell",
      videoUrl: ex.videoUrl || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingExercise) {
        await updateExercise(editingExercise.id, formData);
        success("Exercise updated");
      } else {
        await createExercise(formData);
        success("Exercise created");
      }
      setIsModalOpen(false);
    } catch (_err) {
      showError("Failed to save exercise");
    }
  };

  const handleDelete = async () => {
    if (!deletingExerciseId) return;
    try {
      await deleteExercise(deletingExerciseId);
      success("Exercise deleted");
      setDeletingExerciseId(null);
    } catch (_err) {
      showError("Failed to delete exercise");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            <SearchIcon className="w-5 h-5" />
          </div>
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleOpenNew} variant="primary" className="whitespace-nowrap">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Exercise
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {MUSCLE_GROUPS.map((mg) => (
          <Badge
            key={mg}
            variant={selectedMuscle === mg ? "blue" : "default"}
            className="cursor-pointer"
            onClick={() => setSelectedMuscle(mg)}
          >
            {formatLabel(mg)}
          </Badge>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-32 bg-gray-800/60"></CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 text-red-400 rounded-lg">{error}</div>
      ) : filteredExercises.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          <p>No exercises found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExercises.map((ex) => (
            <Card key={ex.id} className="group hover:border-gray-600 transition-colors">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium text-gray-100">{ex.name}</h3>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(ex)}
                      className="text-gray-400 hover:text-blue-400"
                    >
                      <EditIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingExerciseId(ex.id)}
                      className="text-gray-400 hover:text-red-400"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-auto">
                  <Badge variant="default">{formatLabel(ex.muscleGroup)}</Badge>
                  <Badge variant="default">
                    {ex.equipment ? formatLabel(ex.equipment) : "N/A"}
                  </Badge>
                  {ex.videoUrl && (
                    <a
                      href={ex.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 ml-auto"
                    >
                      <VideoIcon className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExercise ? "Edit Exercise" : "Add Exercise"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Muscle Group</label>
              <Select
                value={formData.muscleGroup || "chest"}
                onChange={(e) =>
                  setFormData({ ...formData, muscleGroup: e.target.value as MuscleGroup })
                }
                options={MUSCLE_GROUPS.filter((m): m is MuscleGroup => m !== "all").map((m) => ({
                  value: m,
                  label: formatLabel(m),
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Equipment</label>
              <Select
                value={formData.equipment || "dumbbell"}
                onChange={(e) =>
                  setFormData({ ...formData, equipment: e.target.value as EquipmentType })
                }
                options={EQUIPMENT_TYPES.map((e) => ({ value: e, label: formatLabel(e) }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Video URL (optional)
            </label>
            <Input
              type="url"
              value={formData.videoUrl || ""}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Exercise
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deletingExerciseId}
        title="Delete Exercise"
        message="Are you sure you want to delete this exercise? This will permanently remove it from your library."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeletingExerciseId(null)}
        variant="danger"
      />
    </div>
  );
}
