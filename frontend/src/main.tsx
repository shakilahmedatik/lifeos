import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App.js";
import "./index.css";
import { initDataSource, isTauri } from "./lib/dataSource.js";

async function bootstrap() {
  // Initialize local data source if in Tauri
  await initDataSource();

  const root = document.getElementById("root");
  if (!root) throw new Error("Root element not found");

  const Router = isTauri() ? HashRouter : BrowserRouter;

  createRoot(root).render(
    <StrictMode>
      <Router>
        <App />
      </Router>
    </StrictMode>,
  );
}

bootstrap();
