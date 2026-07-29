// @vitest-environment jsdom
import type { Task } from "@lifeos/contracts";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import TaskCategoryBadge from "../TaskCategoryBadge.js";
import TaskList, { computeDurationMins } from "../TaskList.js";

const sampleTask: Task = {
  id: "task-1",
  title: "Morning Run",
  category: "workout",
  date: "2026-07-27",
  startTime: "06:00",
  endTime: "07:00",
  status: "planned",
  recurrence: "daily",
  reminderSilent: false,
  createdAt: "2026-07-27T00:00:00Z",
  updatedAt: "2026-07-27T00:00:00Z",
};

describe("Routine Component Unit Tests", () => {
  it("computes standard and overnight task durations correctly", () => {
    expect(computeDurationMins("09:00", "10:30")).toBe(90);
    expect(computeDurationMins("23:00", "01:00")).toBe(120);
  });

  it("renders category badge with correct title", () => {
    render(<TaskCategoryBadge category="learning" />);
    expect(screen.getByText("Learning")).toBeDefined();
  });

  it("renders task list with accessible buttons and controls", () => {
    const handleStatus = vi.fn();
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();

    render(
      <MemoryRouter>
        <TaskList
          tasks={[sampleTask]}
          onStatusChange={handleStatus}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Morning Run")).toBeDefined();
    expect(screen.getByText("60 mins")).toBeDefined();

    const editBtn = screen.getByLabelText("Edit task Morning Run");
    expect(editBtn).toBeDefined();
    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalledWith(sampleTask);

    const deleteBtn = screen.getByLabelText("Delete task Morning Run");
    expect(deleteBtn).toBeDefined();
    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith("task-1");
  });
});
