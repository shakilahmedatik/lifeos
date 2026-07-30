const TIMEZONE_OFFSET_MINUTES = (() => {
  const envOffset = process.env.TIMEZONE_OFFSET_MINUTES;
  if (envOffset !== undefined) {
    const parsed = Number(envOffset);
    if (!Number.isNaN(parsed) && parsed >= -720 && parsed <= 840) {
      return parsed;
    }
  }
  return 6 * 60; // UTC+6 (Asia/Dhaka) default
})();

export function nowInTimezone(): Date {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + TIMEZONE_OFFSET_MINUTES * 60000);
}

export function todayInTimezone(): string {
  return nowInTimezone().toISOString().split("T")[0];
}

export function nowIsoInTimezone(): string {
  return nowInTimezone().toISOString();
}

// Backward-compatible aliases
export const nowInDhaka = nowInTimezone;
export const todayInDhaka = todayInTimezone;
export const nowIsoInDhaka = nowIsoInTimezone;
