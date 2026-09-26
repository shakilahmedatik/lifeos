import { isTauri } from "./platform.js";

/**
 * Safely opens an external URL in the user's default system browser.
 * Uses `@tauri-apps/plugin-opener` in Tauri desktop mode to prevent
 * webview navigation hijacking, and falls back to `window.open` on the web.
 */
export async function openExternalUrl(url: string): Promise<void> {
  if (!url) return;

  if (isTauri()) {
    try {
      const { openUrl } = await import("@tauri-apps/plugin-opener");
      await openUrl(url);
      return;
    } catch (err) {
      console.warn("Failed to open URL via Tauri opener plugin, falling back to window.open", err);
    }
  }

  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
