import { api } from "./api.js";

// Detect if running inside Tauri
export const isTauri = () => typeof window !== "undefined" && "__TAURI__" in window;

let _localDal: typeof import("./local-db/dal.js").localDal | null = null;

// Lazy dynamic getter for local DAL in Tauri environment
async function getLocalDal() {
  if (!_localDal) {
    const { localDal } = await import("./local-db/dal.js");
    _localDal = localDal;
  }
  return _localDal;
}

export function getDataSource() {
  if (isTauri() && _localDal) {
    return _localDal;
  }
  return api;
}

// Pre-initialize local DAL if in Tauri
if (isTauri()) {
  getLocalDal().catch(() => {});
}

export { api as dataSource };
