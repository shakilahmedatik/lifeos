import { api } from "./api";

// Detect if running inside Tauri
export const isTauri = () => typeof window !== "undefined" && "__TAURI__" in window;

// Phase 1: HTTP API implementation for all calls
// Phase 2: Will check isTauri() and route to local SQLite DAL when inside Tauri
export function getDataSource() {
  return api;
}

export { api as dataSource };
