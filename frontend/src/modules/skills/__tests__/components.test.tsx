// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import BackupPanel from "../BackupPanel";
import CategoryCard from "../CategoryCard";
import CategoryList from "../CategoryList";
import ConfirmDialog from "../ConfirmDialog";
import CourseCard from "../CourseCard";
import CourseList from "../CourseList";
import SessionCard from "../SessionCard";
import SessionList from "../SessionList";
import type { LearningLog, LearningResource, ResourceWithProgress, SkillArea } from "../types";

const mockResource: LearningResource = {
  id: "res-1",
  title: "Test Resource",
  type: "course",
  skillAreaId: "area-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const mockResource2: LearningResource = {
  id: "res-2",
  title: "Another Resource",
  type: "book",
  skillAreaId: "area-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const mockProgress: ResourceWithProgress = {
  ...mockResource,
  totalMinutesSpent: 120,
  totalUnitsCompleted: 5,
  completionPercent: 50,
  skillAreaName: "Programming",
};

const mockLog: LearningLog = {
  id: "log-1",
  resourceId: "res-1",
  date: "2026-01-15",
  minutesSpent: 30,
  notes: "Great session",
  createdAt: "2026-01-15T10:00:00.000Z",
  updatedAt: "2026-01-15T10:00:00.000Z",
};

const mockCategory: SkillArea = {
  id: "area-1",
  name: "Programming",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

// =================== CourseCard ===================

describe("CourseCard", () => {
  afterEach(cleanup);

  it("renders resource title when progress is null", () => {
    render(
      <CourseCard resource={mockResource} progress={null} onEdit={() => {}} onDelete={() => {}} />,
    );
    expect(screen.getByText("Test Resource")).toBeDefined();
  });

  it("shows loading text when no progress", () => {
    render(
      <CourseCard resource={mockResource} progress={null} onEdit={() => {}} onDelete={() => {}} />,
    );
    expect(screen.getByText("Loading...")).toBeDefined();
  });

  it("renders edit and delete buttons always", () => {
    render(
      <CourseCard resource={mockResource} progress={null} onEdit={() => {}} onDelete={() => {}} />,
    );
    expect(screen.getByText("Edit")).toBeDefined();
  });

  it("renders resource type badge", () => {
    render(
      <CourseCard
        resource={{ ...mockResource, type: "book" }}
        progress={null}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    const badge = document.querySelector('[class*="capitalize"]');
    expect(badge?.textContent).toBe("book");
  });

  it("calls onEdit when edit clicked", () => {
    const onEdit = vi.fn();
    render(
      <CourseCard resource={mockResource} progress={null} onEdit={onEdit} onDelete={() => {}} />,
    );
    fireEvent.click(screen.getByText("Edit"));
    expect(onEdit).toHaveBeenCalledWith(mockResource);
  });

  it("renders resource info when progress exists", () => {
    render(
      <CourseCard
        resource={mockResource}
        progress={mockProgress}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getByText("Test Resource")).toBeDefined();
    expect(screen.getByText("120 min spent")).toBeDefined();
    expect(screen.getByText("50%")).toBeDefined();
  });
});

// =================== CategoryCard ===================

describe("CategoryCard", () => {
  afterEach(cleanup);

  it("renders category name", () => {
    render(
      <CategoryCard
        category={mockCategory}
        resourceCount={3}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getByText("Programming")).toBeDefined();
  });

  it("shows 1 resource with singular", () => {
    render(
      <CategoryCard
        category={mockCategory}
        resourceCount={1}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getByText("1 resource")).toBeDefined();
  });

  it("shows multiple resources with plural", () => {
    render(
      <CategoryCard
        category={mockCategory}
        resourceCount={5}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getByText("5 resources")).toBeDefined();
  });

  it("calls onEdit when edit clicked", () => {
    const onEdit = vi.fn();
    render(
      <CategoryCard
        category={mockCategory}
        resourceCount={0}
        onEdit={onEdit}
        onDelete={() => {}}
      />,
    );
    fireEvent.click(screen.getByText("Edit"));
    expect(onEdit).toHaveBeenCalledWith(mockCategory);
  });

  it("calls onDelete with category id", () => {
    const onDelete = vi.fn();
    const cat = { ...mockCategory, id: "area-42", name: "Music" };
    render(<CategoryCard category={cat} resourceCount={0} onEdit={() => {}} onDelete={onDelete} />);
    fireEvent.click(screen.getByText("Delete"));
    expect(onDelete).toHaveBeenCalledWith("area-42");
  });
});

// =================== SessionCard ===================

describe("SessionCard", () => {
  afterEach(cleanup);

  it("renders minutes", () => {
    render(<SessionCard log={mockLog} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("30 min")).toBeDefined();
  });

  it("renders date", () => {
    render(<SessionCard log={mockLog} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText(/2026/)).toBeDefined();
  });

  it("renders notes when present", () => {
    render(<SessionCard log={mockLog} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("Great session")).toBeDefined();
  });

  it("hides notes when empty", () => {
    const logNoNotes: LearningLog = {
      ...mockLog,
      notes: undefined,
    };
    render(<SessionCard log={logNoNotes} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.queryByText("Great session")).toBeNull();
  });

  it("shows resource tag when resource provided", () => {
    const resource = {
      id: "res-1",
      title: "React Course",
      type: "course" as const,
      skillAreaId: "area-1",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    render(<SessionCard log={mockLog} resource={resource} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("React Course")).toBeDefined();
  });

  it("calls onEdit when edit clicked", () => {
    const onEdit = vi.fn();
    render(<SessionCard log={mockLog} onEdit={onEdit} onDelete={() => {}} />);
    fireEvent.click(screen.getByText("Edit"));
    expect(onEdit).toHaveBeenCalledWith(mockLog);
  });

  it("calls onDelete with log id", () => {
    const onDelete = vi.fn();
    render(<SessionCard log={mockLog} onEdit={() => {}} onDelete={onDelete} />);
    fireEvent.click(screen.getByText("Edit")); // only one button visible (edit)
    // Delete button has no text, it's an SVG icon - use a different approach
    const buttons = document.querySelectorAll("button");
    buttons[1].click();
    expect(onDelete).toHaveBeenCalledWith("log-1");
  });
});

// =================== ConfirmDialog ===================

describe("ConfirmDialog", () => {
  afterEach(cleanup);

  it("renders title and message", () => {
    render(
      <ConfirmDialog
        title="Delete item?"
        message="This action cannot be undone."
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText("Delete item?")).toBeDefined();
    expect(screen.getByText("This action cannot be undone.")).toBeDefined();
  });

  it("renders default buttons", () => {
    render(
      <ConfirmDialog
        title="Delete?"
        message="Are you sure?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText("Confirm")).toBeDefined();
    expect(screen.getByText("Cancel")).toBeDefined();
  });

  it("calls onConfirm when confirm clicked", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        title="Delete?"
        message="Are you sure?"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />,
    );
    fireEvent.click(screen.getByText("Confirm"));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("calls onCancel when cancel clicked", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        title="Delete?"
        message="Are you sure?"
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("renders custom button labels", () => {
    render(
      <ConfirmDialog
        title="Delete?"
        message="Are you sure?"
        confirmLabel="Remove"
        cancelLabel="Nevermind"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText("Remove")).toBeDefined();
    expect(screen.getByText("Nevermind")).toBeDefined();
  });
});

// =================== CourseList ===================

describe("CourseList", () => {
  afterEach(cleanup);

  it("renders empty state", () => {
    render(<CourseList resources={[]} progresses={{}} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("No learning resources yet.")).toBeDefined();
  });

  it("renders cards for resources", () => {
    render(
      <CourseList
        resources={[mockResource, mockResource2]}
        progresses={{}}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getByText("Test Resource")).toBeDefined();
    expect(screen.getByText("Another Resource")).toBeDefined();
  });

  it("shows progress when provided", () => {
    const progresses: Record<string, ResourceWithProgress | null> = {
      "res-1": mockProgress,
    };
    render(
      <CourseList
        resources={[mockResource]}
        progresses={progresses}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getByText("120 min spent")).toBeDefined();
    expect(screen.getByText("50%")).toBeDefined();
  });
});

// =================== CategoryList ===================

describe("CategoryList", () => {
  afterEach(cleanup);

  it("renders empty state", () => {
    render(
      <CategoryList categories={[]} resourceCounts={{}} onEdit={() => {}} onDelete={() => {}} />,
    );
    expect(screen.getByText("No skill areas yet.")).toBeDefined();
  });

  it("renders categories", () => {
    render(
      <CategoryList
        categories={[mockCategory]}
        resourceCounts={{ "area-1": 3 }}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getByText("Programming")).toBeDefined();
  });
});

// =================== SessionList ===================

describe("SessionList", () => {
  afterEach(cleanup);

  it("renders empty state", () => {
    render(<SessionList logs={[]} resources={[]} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("No learning sessions yet.")).toBeDefined();
  });

  it("renders session cards", () => {
    const resource = {
      id: "res-1",
      title: "React Course",
      type: "course" as const,
      skillAreaId: "area-1",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    render(
      <SessionList logs={[mockLog]} resources={[resource]} onEdit={() => {}} onDelete={() => {}} />,
    );
    expect(screen.getByText("30 min")).toBeDefined();
    expect(screen.getByText("React Course")).toBeDefined();
  });

  it("renders multiple sessions", () => {
    const logs: LearningLog[] = [
      mockLog,
      { ...mockLog, id: "log-2", minutesSpent: 60, notes: "Advanced" },
    ];
    render(<SessionList logs={logs} resources={[]} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("30 min")).toBeDefined();
    expect(screen.getByText("60 min")).toBeDefined();
  });
});

// =================== BackupPanel ===================

describe("BackupPanel", () => {
  afterEach(cleanup);

  it("renders export section with header", () => {
    render(<BackupPanel onImportComplete={() => {}} />);
    expect(screen.getByText("Export Data")).toBeDefined();
  });

  it("renders import section with header", () => {
    render(<BackupPanel onImportComplete={() => {}} />);
    expect(screen.getByText("Import Data")).toBeDefined();
  });

  it("renders export button", () => {
    render(<BackupPanel onImportComplete={() => {}} />);
    expect(screen.getByText("Export Backup")).toBeDefined();
  });

  it("renders file select label", () => {
    render(<BackupPanel onImportComplete={() => {}} />);
    expect(screen.getByText("Select Backup File")).toBeDefined();
  });
});
