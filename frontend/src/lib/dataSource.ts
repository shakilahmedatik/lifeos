import { api } from "./api.js";
import { log } from "./logger.js";
import { isTauri } from "./platform.js";

const dataLog = log.child("data");

let _localDal: typeof import("./local-db/dal.js").localDal | null = null;
let _initPromise: Promise<void> | null = null;

// Initialize the local DAL if in Tauri environment
export async function initDataSource(): Promise<void> {
  if (!isTauri()) return;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    try {
      const { localDal } = await import("./local-db/dal.js");
      _localDal = localDal;
      dataLog.info("Local DAL initialized successfully");
    } catch (err) {
      dataLog.error("Failed to initialize local DAL", {
        error: (err as Error).message,
      });
    }
  })();

  return _initPromise;
}

export function getDataSource() {
  if (isTauri() && _localDal) {
    return _localDal;
  }
  return api;
}

export { isTauri };
