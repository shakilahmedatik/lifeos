/**
 * Structured browser logger for LifeOS frontend.
 *
 * - Color-coded console output with module prefixes
 * - Automatically disabled in production (all calls become no-ops)
 * - Child loggers via log.child("module-name")
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const IS_DEV = import.meta.env.DEV;

// ── Level Styling (CSS for %c in console) ────────────────────────────────
const LEVEL_STYLES: Record<LogLevel, { badge: string; text: string; icon: string }> = {
  debug: {
    badge: "background:#6b7280;color:#fff;padding:1px 6px;border-radius:3px;font-weight:600",
    text: "color:#9ca3af",
    icon: "🔍",
  },
  info: {
    badge: "background:#0ea5e9;color:#fff;padding:1px 6px;border-radius:3px;font-weight:600",
    text: "color:#38bdf8",
    icon: "✦",
  },
  warn: {
    badge: "background:#f59e0b;color:#000;padding:1px 6px;border-radius:3px;font-weight:600",
    text: "color:#fbbf24",
    icon: "⚠",
  },
  error: {
    badge: "background:#ef4444;color:#fff;padding:1px 6px;border-radius:3px;font-weight:600",
    text: "color:#f87171;font-weight:bold",
    icon: "✖",
  },
};

// ── No-op logger for production ──────────────────────────────────────────
const noop = () => {};
const noopLogger: BrowserLogger = {
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
  child: () => noopLogger,
};

// ── Logger Interface ─────────────────────────────────────────────────────
export interface BrowserLogger {
  debug: (msg: string, meta?: Record<string, unknown>) => void;
  info: (msg: string, meta?: Record<string, unknown>) => void;
  warn: (msg: string, meta?: Record<string, unknown>) => void;
  error: (msg: string, meta?: Record<string, unknown>) => void;
  child: (module: string) => BrowserLogger;
}

// ── Core Log Function ────────────────────────────────────────────────────
function logMessage(
  level: LogLevel,
  module: string | undefined,
  msg: string,
  meta?: Record<string, unknown>,
) {
  const { badge, text, icon } = LEVEL_STYLES[level];
  const moduleTag = module ? `[${module}]` : "";
  const prefix = `${icon} %c${level.toUpperCase()}%c ${moduleTag} ${msg}`;

  const consoleFn =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : level === "debug"
          ? console.debug
          : console.log;

  if (meta && Object.keys(meta).length > 0) {
    consoleFn(prefix, badge, text, meta);
  } else {
    consoleFn(prefix, badge, text);
  }
}

// ── Logger Factory ───────────────────────────────────────────────────────
function createBrowserLogger(module?: string): BrowserLogger {
  if (!IS_DEV) return noopLogger;

  return {
    debug: (msg, meta) => logMessage("debug", module, msg, meta),
    info: (msg, meta) => logMessage("info", module, msg, meta),
    warn: (msg, meta) => logMessage("warn", module, msg, meta),
    error: (msg, meta) => logMessage("error", module, msg, meta),
    child: (childModule: string) => createBrowserLogger(childModule),
  };
}

export const log: BrowserLogger = createBrowserLogger();
