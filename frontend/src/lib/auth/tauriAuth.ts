import { isTauri } from "../dataSource.js";

const STORE_FILE = "lifeos-auth.json";
const SESSION_KEY = "auth_session";

export interface StoredSession {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export async function getTauriStoredSession(): Promise<StoredSession | null> {
  if (!isTauri()) return null;
  try {
    const { Store } = await import("@tauri-apps/plugin-store");
    const store = await Store.load(STORE_FILE);
    const session = await store.get<StoredSession>(SESSION_KEY);
    return session || null;
  } catch {
    return null;
  }
}

export async function setTauriStoredSession(session: StoredSession): Promise<void> {
  if (!isTauri()) return;
  try {
    const { Store } = await import("@tauri-apps/plugin-store");
    const store = await Store.load(STORE_FILE);
    await store.set(SESSION_KEY, session);
    await store.save();
  } catch {}
}

export async function clearTauriStoredSession(): Promise<void> {
  if (!isTauri()) return;
  try {
    const { Store } = await import("@tauri-apps/plugin-store");
    const store = await Store.load(STORE_FILE);
    await store.delete(SESSION_KEY);
    await store.save();
  } catch {}
}
