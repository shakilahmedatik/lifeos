export type Platform = "tauri" | "web";

/**
 * Returns the current runtime platform.
 * Detects whether the app is running inside a Tauri webview or in a regular browser.
 */
export function getPlatform(): Platform {
  return typeof window !== "undefined" && ("__TAURI__" in window || "__TAURI_INTERNALS__" in window)
    ? "tauri"
    : "web";
}

export function isTauri(): boolean {
  return getPlatform() === "tauri";
}
