// @vitest-environment jsdom
import type { LearningResource } from "@lifeos/contracts";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SessionForm from "../SessionForm";

const mockResources: LearningResource[] = [
  {
    id: "res-101",
    title: "TypeScript Deep Dive",
    type: "course",
    skillAreaId: "area-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "res-102",
    title: "React Performance Handbook",
    type: "book",
    skillAreaId: "area-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

describe("Routine & Skills Automation Integration", () => {
  afterEach(cleanup);

  it("pre-populates initialResourceId and initialMinutesSpent in SessionForm when opened via task automation", () => {
    const handleSubmit = vi.fn();
    const handleCancel = vi.fn();

    render(
      <SessionForm
        resources={mockResources}
        initialResourceId="res-102"
        initialMinutesSpent={45}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />,
    );

    const resourceSelect = screen.getByLabelText("Learning Resource") as HTMLSelectElement;
    expect(resourceSelect.value).toBe("res-102");

    const minutesInput = screen.getByLabelText("Minutes") as HTMLInputElement;
    expect(minutesInput.value).toBe("45");

    fireEvent.submit(screen.getByRole("button", { name: "Log Session" }));

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceId: "res-102",
        minutesSpent: 45,
      }),
    );
  });
});
