import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement } from "react";
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "../components/Toast.js";

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(
    <ToastProvider>
      <BrowserRouter>{ui}</BrowserRouter>
    </ToastProvider>,
    options,
  );
}

export * from "@testing-library/react";
