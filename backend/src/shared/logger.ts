type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = LEVELS[(process.env.LOG_LEVEL as LogLevel) || "debug"] ?? LEVELS.debug;

// ── ANSI Colors ──────────────────────────────────────────────────────────
const isTTY = process.stdout.isTTY ?? false;

const c = {
  reset: isTTY ? "\x1b[0m" : "",
  bold: isTTY ? "\x1b[1m" : "",
  dim: isTTY ? "\x1b[2m" : "",
  red: isTTY ? "\x1b[31m" : "",
  green: isTTY ? "\x1b[32m" : "",
  yellow: isTTY ? "\x1b[33m" : "",
  cyan: isTTY ? "\x1b[36m" : "",
  gray: isTTY ? "\x1b[90m" : "",
  white: isTTY ? "\x1b[37m" : "",
  bgRed: isTTY ? "\x1b[41m" : "",
};

// ── Level Styling ────────────────────────────────────────────────────────
const LEVEL_CONFIG: Record<LogLevel, { icon: string; label: string; color: string }> = {
  debug: { icon: "🔍", label: "DEBUG", color: c.gray },
  info: { icon: "✦", label: " INFO", color: c.cyan },
  warn: { icon: "⚠", label: " WARN", color: c.yellow },
  error: { icon: "✖", label: "ERROR", color: c.red + c.bold },
};

// ── Formatting ───────────────────────────────────────────────────────────
function formatTimestamp(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatMeta(meta: Record<string, unknown>): string {
  const parts: string[] = [];
  let stackTrace = "";

  for (const [key, value] of Object.entries(meta)) {
    if (key === "stack" && typeof value === "string") {
      // Format stack trace on separate lines
      const lines = value
        .split("\n")
        .filter((line) => line.trim().startsWith("at "))
        .slice(0, 5) // limit to 5 frames
        .map((line) => `                ${c.dim}${line.trim()}${c.reset}`)
        .join("\n");
      if (lines) {
        stackTrace = `\n${c.dim}              stack:${c.reset}\n${lines}`;
      }
      continue;
    }
    if (key === "error" && typeof value === "string") {
      parts.push(`${c.red}error=${c.reset}${c.red}"${value}"${c.reset}`);
      continue;
    }

    const formatted =
      typeof value === "string"
        ? value.length > 200
          ? `"${value.slice(0, 200)}…"`
          : `"${value}"`
        : typeof value === "object" && value !== null
          ? JSON.stringify(value).slice(0, 200)
          : String(value);

    parts.push(`${c.dim}${key}=${c.reset}${formatted}`);
  }

  let line = "";
  if (parts.length > 0) {
    line = `  ${parts.join(" ")}`;
  }
  return line + stackTrace;
}

// ── Core Log Function ────────────────────────────────────────────────────
function log(
  level: LogLevel,
  module: string | undefined,
  message: string,
  meta?: Record<string, unknown>,
) {
  if (LEVELS[level] < currentLevel) return;

  const { icon, label, color } = LEVEL_CONFIG[level];
  const time = `${c.dim}${formatTimestamp()}${c.reset}`;
  const levelStr = `${color}${icon} ${label}${c.reset}`;
  const moduleStr = module
    ? `${c.dim}[${c.reset}${c.white}${module}${c.reset}${c.dim}]${c.reset}`
    : "";
  const msg = `${c.bold}${message}${c.reset}`;
  const metaStr = meta && Object.keys(meta).length > 0 ? formatMeta(meta) : "";

  const output = `${time} ${levelStr} ${moduleStr} ${msg}${metaStr}`;

  if (level === "error") {
    console.error(output);
  } else if (level === "warn") {
    console.warn(output);
  } else {
    console.log(output);
  }
}

// ── Logger Interface ─────────────────────────────────────────────────────
export interface Logger {
  debug: (msg: string, meta?: Record<string, unknown>) => void;
  info: (msg: string, meta?: Record<string, unknown>) => void;
  warn: (msg: string, meta?: Record<string, unknown>) => void;
  error: (msg: string, meta?: Record<string, unknown>) => void;
  child: (context: { module: string }) => Logger;
}

function createLogger(module?: string): Logger {
  return {
    debug: (msg: string, meta?: Record<string, unknown>) => log("debug", module, msg, meta),
    info: (msg: string, meta?: Record<string, unknown>) => log("info", module, msg, meta),
    warn: (msg: string, meta?: Record<string, unknown>) => log("warn", module, msg, meta),
    error: (msg: string, meta?: Record<string, unknown>) => log("error", module, msg, meta),
    child: (context: { module: string }) => createLogger(context.module),
  };
}

export const logger: Logger = createLogger();
