import type { DayOfWeek } from "@lifeos/contracts";
import type { SubmitEvent } from "react";
import Button from "../../../components/ui/Button.js";
import { Input } from "../../../components/ui/Input.js";
import Modal from "../../../components/ui/Modal.js";
import ModalFooter from "../../../components/ui/ModalFooter.js";
import { Select } from "../../../components/ui/Select.js";

interface WorkoutEditModalProps {
  open: boolean;
  name: string;
  onChangeName: (val: string) => void;
  description: string;
  onChangeDescription: (val: string) => void;
  scheduledDay: DayOfWeek | "";
  onChangeScheduledDay: (val: DayOfWeek | "") => void;
  onSubmit: (e: SubmitEvent) => void;
  onClose: () => void;
}

export function WorkoutEditModal({
  open,
  name,
  onChangeName,
  description,
  onChangeDescription,
  scheduledDay,
  onChangeScheduledDay,
  onSubmit,
  onClose,
}: WorkoutEditModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Edit Workout Plan">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Name</label>
          <Input
            value={name}
            onChange={(e) => onChangeName(e.target.value)}
            placeholder="e.g. Upper Body Power"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">
            Description (optional)
          </label>
          <Input
            value={description}
            onChange={(e) => onChangeDescription(e.target.value)}
            placeholder="Brief description of the workout"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">
            Scheduled Day (optional)
          </label>
          <Select
            value={scheduledDay}
            onChange={(e) => onChangeScheduledDay(e.target.value as DayOfWeek | "")}
            options={[
              { value: "", label: "None" },
              { value: "monday", label: "Monday" },
              { value: "tuesday", label: "Tuesday" },
              { value: "wednesday", label: "Wednesday" },
              { value: "thursday", label: "Thursday" },
              { value: "friday", label: "Friday" },
              { value: "saturday", label: "Saturday" },
              { value: "sunday", label: "Sunday" },
            ]}
          />
        </div>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Save Changes
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
