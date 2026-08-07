import type { HabitDefinition, HabitType, NewHabitDefinitionInput } from "@lifeos/contracts";
import {
  Archive,
  ArrowUpCircle,
  ChevronDown,
  ChevronUp,
  Edit2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useAppToast } from "../../../components/Toast.js";
import Button from "../../../components/ui/Button.js";
import Card, { CardContent } from "../../../components/ui/Card.js";
import Modal from "../../../components/ui/Modal.js";
import { HABIT_TEMPLATES, type HabitTemplate } from "../HabitTemplates.js";
import { HabitConfigForm } from "./HabitConfigForm.js";

interface HabitBuilderProps {
  habits: HabitDefinition[];
  loading: boolean;
  onCreate: (data: NewHabitDefinitionInput) => Promise<HabitDefinition>;
  onUpdate: (id: string, data: Partial<HabitDefinition>) => Promise<HabitDefinition>;
  onDelete: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onReorder?: (ids: string[]) => Promise<void>;
}

export function HabitBuilder({
  habits,
  loading,
  onCreate,
  onUpdate,
  onDelete,
  onArchive,
  onReorder,
}: HabitBuilderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<HabitType | null>(null);
  const [editingHabit, setEditingHabit] = useState<HabitDefinition | null>(null);
  const [initialFormValues, setInitialFormValues] = useState<
    Partial<NewHabitDefinitionInput> | undefined
  >(undefined);

  const activeHabits = habits.filter((h) => !h.archived);
  const archivedHabits = habits.filter((h) => h.archived);

  const toast = useAppToast();

  const openNew = (type: HabitType) => {
    setSelectedType(type);
    setEditingHabit(null);
    setInitialFormValues(undefined);
    setIsModalOpen(true);
  };

  const openEdit = (habit: HabitDefinition) => {
    setSelectedType(habit.type);
    setEditingHabit(habit);
    setInitialFormValues(habit);
    setIsModalOpen(true);
  };

  const applyTemplate = (template: HabitTemplate) => {
    setSelectedType(template.type);
    setEditingHabit(null);
    setInitialFormValues({
      name: template.name,
      type: template.type,
      category: template.category,
      icon: template.icon,
      color: template.color,
      config: template.config,
    });
    setIsTemplatesOpen(false);
    setIsModalOpen(true);
  };

  const handleSave = async (data: NewHabitDefinitionInput) => {
    try {
      if (editingHabit) {
        await onUpdate(editingHabit.id, data);
        toast.success("Habit updated");
      } else {
        await onCreate(data);
        toast.success("Habit created");
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      const rawMessage = err instanceof Error ? err.message : String(err);
      let message = rawMessage || "Failed to save habit";
      try {
        const parsed = JSON.parse(rawMessage.replace(/^API error \d+: /, ""));
        if (parsed.error) message = parsed.error;
      } catch {}
      toast.error(message);
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    if (!onReorder) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeHabits.length) return;

    const newOrder = [...activeHabits];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    const ids = newOrder.map((h) => h.id);
    await onReorder(ids);
  };

  if (loading) return <div className="animate-pulse h-32 bg-card rounded-xl"></div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center bg-surface p-4 rounded-xl border border-border">
        <div>
          <h3 className="font-semibold text-primary">Build a New Habit</h3>
          <p className="text-xs text-secondary">
            Choose a habit type or pick from pre-configured healthy templates.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsTemplatesOpen(true)}
          icon={<Sparkles size={16} />}
        >
          Browse Templates
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(["water", "walking", "prayer", "timed", "boolean"] as HabitType[]).map((t) => (
          <Button
            key={t}
            variant="secondary"
            onClick={() => openNew(t)}
            className="h-20 flex flex-col gap-1.5 justify-center"
          >
            <Plus size={16} />
            <span className="capitalize text-sm font-medium">{t}</span>
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-primary">Active Habits</h3>
        {activeHabits.length === 0 ? (
          <div className="p-8 text-center text-muted bg-surface rounded-xl border border-border">
            No active habits. Click a type above or Browse Templates to add one!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeHabits.map((habit, index) => (
              <Card key={habit.id} className="bg-card group hover:border-border-subtle transition-all">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {onReorder && (
                      <div className="flex flex-col gap-0.5 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button
                          disabled={index === 0}
                          onClick={() => handleMove(index, "up")}
                          className="text-secondary hover:text-white disabled:opacity-20"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          disabled={index === activeHabits.length - 1}
                          onClick={() => handleMove(index, "down")}
                          className="text-secondary hover:text-white disabled:opacity-20"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    )}
                    <div className="text-2xl">{habit.icon || "📌"}</div>
                    <div>
                      <h4 className="font-medium text-primary">{habit.name}</h4>
                      <span className="text-xs text-muted capitalize">
                        {habit.type} • {habit.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(habit)}
                      title="Edit"
                      className="p-2 text-secondary hover:text-blue-400 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => onArchive(habit.id)}
                      title="Archive"
                      className="p-2 text-secondary hover:text-yellow-400 transition-colors"
                    >
                      <Archive size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(habit.id)}
                      title="Delete"
                      className="p-2 text-secondary hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {archivedHabits.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-border">
          <h3 className="text-lg font-medium text-muted">Archived Habits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
            {archivedHabits.map((habit) => (
              <Card key={habit.id} className="bg-surface">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl grayscale">{habit.icon || "📌"}</div>
                    <div>
                      <h4 className="font-medium text-secondary line-through">{habit.name}</h4>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onArchive(habit.id)}
                      title="Unarchive"
                      className="p-2 text-muted hover:text-green-400 transition-colors"
                    >
                      <ArrowUpCircle size={16} />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Habit Config Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingHabit ? "Edit Habit" : `Configure ${selectedType} Habit`}
      >
        {selectedType && (
          <HabitConfigForm
            type={selectedType}
            initialData={initialFormValues}
            onSave={handleSave}
            onCancel={() => setIsModalOpen(false)}
          />
        )}
      </Modal>

      {/* Templates Modal */}
      <Modal
        open={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        title="Healthy Habit Templates"
      >
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <p className="text-xs text-secondary mb-2">
            Select a template to auto-fill your habit configuration.
          </p>
          {HABIT_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => applyTemplate(tmpl)}
              className="p-3 bg-surface border border-border hover:border-emerald-500/50 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{tmpl.icon}</div>
                <div>
                  <h4 className="font-semibold text-primary group-hover:text-emerald-400 transition-colors">
                    {tmpl.name}
                  </h4>
                  <p className="text-xs text-secondary">{tmpl.description}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="group-hover:bg-emerald-600 group-hover:text-white transition-colors"
              >
                Use Template
              </Button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
