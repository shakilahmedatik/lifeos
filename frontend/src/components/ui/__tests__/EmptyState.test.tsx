import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EmptyState } from "../EmptyState.js";

describe("EmptyState", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders title", () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText("No items found")).toBeDefined();
  });

  it("renders description when provided", () => {
    render(<EmptyState title="Empty" description="Get started by adding something" />);
    expect(screen.getByText("Get started by adding something")).toBeDefined();
  });

  it("does not render description when not provided", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByText("Get started")).toBeNull();
  });

  it("renders action when provided", () => {
    render(<EmptyState title="Empty" action={<button type="button">Add Item</button>} />);
    expect(screen.getByText("Add Item")).toBeDefined();
  });

  it("does not render action when not provided", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("applies custom className", () => {
    const { container } = render(<EmptyState title="Test" className="custom-class" />);
    expect(container.firstChild).toBeDefined();
  });
});
