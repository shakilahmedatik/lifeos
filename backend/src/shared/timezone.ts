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

function formatIsoWithOffset(input: Date, offsetMinutes: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  return `${input.getUTCFullYear()}-${pad(input.getUTCMonth() + 1)}-${pad(input.getUTCDate())}T${pad(input.getUTCHours())}:${pad(input.getUTCMinutes())}:${pad(input.getUTCSeconds())}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

export function nowInTimezone(): Date {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + TIMEZONE_OFFSET_MINUTES * 60000);
}

export function todayInTimezone(): string {
  return formatIsoWithOffset(nowInTimezone(), TIMEZONE_OFFSET_MINUTES).slice(0, 10);
}

export function nowIsoInTimezone(): string {
  return formatIsoWithOffset(nowInTimezone(), TIMEZONE_OFFSET_MINUTES);
}

// Backward-compatible aliases
export const nowInDhaka = nowInTimezone;
export const todayInDhaka = todayInTimezone;
export const nowIsoInDhaka = nowIsoInTimezone;
