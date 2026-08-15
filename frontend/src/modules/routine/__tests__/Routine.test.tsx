// @vitest-environment jsdom
import type { RoutineCategory, Task } from "@lifeos/contracts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { RoutineCategoryManager } from "../RoutineCategoryManager.js";
import { RoutineOverview } from "../RoutineOverview.js";
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

const sampleCustomCategory: RoutineCategory = {
  id: "rcat_focus",
  name: "Deep Focus",
  color: "#8b5cf6",
  icon: "🎯",
  isDefault: false,
  sortOrder: 10,
  createdAt: "2026-08-01T00:00:00Z",
  updatedAt: "2026-08-01T00:00:00Z",
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Routine Component Unit Tests", () => {
  it("computes standard and overnight task durations correctly", () => {
    expect(computeDurationMins("09:00", "10:30")).toBe(90);
    expect(computeDurationMins("23:00", "01:00")).toBe(120);
  });

  it("renders category badge with correct title and standard styles", () => {
    render(<TaskCategoryBadge category="learning" />);
    expect(screen.getByText("Learning")).toBeDefined();
  });

  it("renders category badge with custom hex color and icon", () => {
    render(<TaskCategoryBadge category="Deep Focus" categoryObj={sampleCustomCategory} />);
    expect(screen.getByText("Deep Focus")).toBeDefined();
    expect(screen.getByText("🎯")).toBeDefined();
  });

  it("renders task list with accessible buttons and controls", () => {
    const handleStatus = vi.fn();
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();

    renderWithProviders(
      <TaskList
        tasks={[sampleTask]}
        onStatusChange={handleStatus}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />,
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

  it("renders RoutineOverview dashboard with statistics", () => {
    const sampleStats = {
      totalTasks: 10,
      completedTasks: 8,
      plannedTasks: 1,
      inProgressTasks: 1,
      skippedTasks: 0,
      completionRate: 80,
      totalScheduledMinutes: 600,
      completedMinutes: 480,
      completedTodayCount: 3,
      totalTodayCount: 4,
      todayCompletionRate: 75,
      categoryDistribution: [
        { category: "workout" as const, taskCount: 4, totalMinutes: 240, completedMinutes: 240 },
      ],
      weeklyTrends: [{ date: "2026-08-01", total: 2, completed: 2 }],
    };

    renderWithProviders(<RoutineOverview stats={sampleStats} loading={false} />);

    expect(screen.getByText("80%")).toBeDefined();
    expect(screen.getByText("3/4")).toBeDefined();
    expect(screen.getByText("Category Distribution")).toBeDefined();
  });

  it("renders RoutineCategoryManager header and action button", async () => {
    renderWithProviders(<RoutineCategoryManager />);
    await waitFor(() => {
      expect(screen.getByText("Routine Categories")).toBeDefined();
      expect(screen.getByText("New Category")).toBeDefined();
    });
  });
});
