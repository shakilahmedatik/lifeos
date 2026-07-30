import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "../../../components/ui/Button.js";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog.js";
import Modal from "../../../components/ui/Modal.js";
import { api } from "../../../lib/api.js";
import type { LearningLog, LearningResource, NewLearningLogInput } from "../types.js";
import SessionForm from "./SessionForm.js";
import SessionList from "./SessionList.js";

interface SessionsTabProps {
  logs: LearningLog[];
  resources: LearningResource[];
  initialLogResourceId?: string;
  initialLogMinutes?: number;
  automationTaskId?: string | null;
  onClearAutomationTask?: () => void;
  onAddLog: (input: NewLearningLogInput) => Promise<unknown>;
  onEditLog: (id: string, input: NewLearningLogInput) => Promise<unknown>;
  onRemoveLog: (id: string) => Promise<unknown>;
  onLogSuccess?: () => void;
}

export function SessionsTab({
  logs,
  resources,
  initialLogResourceId,
  initialLogMinutes,
  automationTaskId,
  onClearAutomationTask,
  onAddLog,
  onEditLog,
  onRemoveLog,
  onLogSuccess,
}: SessionsTabProps) {
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [editingSession, setEditingSession] = useState<LearningLog | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(
    null,
  );

  useEffect(() => {
    if (initialLogResourceId) {
      setEditingSession(null);
      setShowSessionForm(true);
    }
  }, [initialLogResourceId]);

  const handleCloseForm = () => {
    if (automationTaskId) {
      api.updateTaskStatus(automationTaskId, "planned").catch(console.error);
      onClearAutomationTask?.();
    }
    setShowSessionForm(false);
    setEditingSession(null);
  };

  const handleSessionSubmit = async (input: NewLearningLogInput) => {
    if (editingSession) {
      await onEditLog(editingSession.id, input);
      setEditingSession(null);
    } else {
      await onAddLog(input);
      if (automationTaskId) {
        await api.updateTaskStatus(automationTaskId, "done").catch(console.error);
        onClearAutomationTask?.();
      }
      onLogSuccess?.();
    }
    setShowSessionForm(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation) return;
    await onRemoveLog(deleteConfirmation.id);
    setDeleteConfirmation(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-primary">Learning Sessions</h2>
        <Button
          icon={<Clock size={16} />}
          onClick={() => {
            setEditingSession(null);
            setShowSessionForm(true);
          }}
        >
          Log Session
        </Button>
      </div>

      <Modal
        open={showSessionForm}
        onClose={handleCloseForm}
        title={editingSession ? "Edit Session" : "Log Session"}
      >
        <SessionForm
          log={editingSession ?? undefined}
          resources={resources}
          initialResourceId={initialLogResourceId}
          initialMinutesSpent={initialLogMinutes}
          onSubmit={handleSessionSubmit}
          onCancel={handleCloseForm}
        />
      </Modal>

      <SessionList
        logs={logs}
        resources={resources}
        onEdit={(log) => {
          setEditingSession(log);
          setShowSessionForm(true);
        }}
        onDelete={(id) => {
          const log = logs.find((l) => l.id === id);
          const resource = resources.find((r) => r.id === log?.resourceId);
          setDeleteConfirmation({
            id,
            name: `Session on ${log?.date ?? "unknown date"}${resource ? ` (${resource.title})` : ""}`,
          });
        }}
      />

      {deleteConfirmation && (
        <ConfirmDialog
          open={!!deleteConfirmation}
          title="Delete session"
          message={`Are you sure you want to delete "${deleteConfirmation.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirmation(null)}
        />
      )}
    </div>
  );
}

export default SessionsTab;
