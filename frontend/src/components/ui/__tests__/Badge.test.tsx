import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Badge from "../Badge.js";

describe("Badge", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders children text", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeDefined();
  });

  it("renders as span by default", () => {
    render(<Badge>Test</Badge>);
    const el = screen.getByText("Test");
    expect(el.tagName).toBe("SPAN");
  });

  it("renders as button when onClick is provided", () => {
    const onClick = vi.fn();
    render(<Badge onClick={onClick}>Clickable</Badge>);
    const button = screen.getByRole("button");
    expect(button.tagName).toBe("BUTTON");
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<Badge onClick={onClick}>Click me</Badge>);
    screen.getByRole("button").click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("applies success variant styles", () => {
    render(<Badge variant="success">Done</Badge>);
    const el = screen.getByText("Done");
    expect(el.className).toContain("bg-green-900/60");
  });

  it("applies danger variant styles", () => {
    render(<Badge variant="danger">Error</Badge>);
    const el = screen.getByText("Error");
    expect(el.className).toContain("bg-red-900/60");
  });

  it("applies sm size by default", () => {
    render(<Badge>Small</Badge>);
    const el = screen.getByText("Small");
    expect(el.className).toContain("text-xs");
  });

  it("applies md size when specified", () => {
    render(<Badge size="md">Medium</Badge>);
    const el = screen.getByText("Medium");
    expect(el.className).toContain("py-1");
  });

  it("applies custom className", () => {
    render(<Badge className="custom-class">Custom</Badge>);
    const el = screen.getByText("Custom");
    expect(el.className).toContain("custom-class");
  });
});
