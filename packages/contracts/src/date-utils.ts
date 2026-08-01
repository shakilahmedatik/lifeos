/**
 * Returns YYYY-MM-DD based on a target timezone (IANA format).
 * If the user has a configured timezone (from settings), use that.
 * Otherwise, fall back to the browser's local timezone.
 *
 * Why not just use getTimezoneOffset()? Because:
 * 1. getTimezoneOffset() returns the *current* offset, which may differ from
 *    the offset on the target date (DST transitions).
 * 2. The user's device timezone may differ from their intended tracking timezone.
 *    A user in UTC whose tasks are in Asia/Dhaka needs Dhaka dates, not UTC dates.
 */
export function getClientDateString(timezone = "Asia/Dhaka"): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: timezone });
}

export function getClientMonthString(timezone = "Asia/Dhaka"): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  return `${year}-${month}`;
}

export function getClientCurrentMinute(): Date {
  return new Date();
}

/**
 * Validates if a date string is a real calendar date (YYYY-MM-DD).
 */
export function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/**
 * Checks if a YYYY-MM-DD date is a weekday.
 * Mode "bd" (Bangladesh): Sun-Thu (days 0,1,2,3,4) are weekdays; Fri & Sat (5,6) are offdays.
 * Mode "standard": Mon-Fri (days 1,2,3,4,5) are weekdays.
 * Default is "bd" (Bangladesh).
 */
export function isWeekday(dateStr: string, mode: "bd" | "standard" = "bd"): boolean {
  if (!isValidDateString(dateStr)) return false;
  const [y, m, d] = dateStr.split("-").map(Number);
  const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat
  if (mode === "bd") {
    // Sun(0), Mon(1), Tue(2), Wed(3), Thu(4) are weekdays in BD
    return dayOfWeek >= 0 && dayOfWeek <= 4;
  }
  // Standard Mon-Fri
  return dayOfWeek >= 1 && dayOfWeek <= 5;
}

/**
 * Returns the DayOfWeek index (0 = Sun, 1 = Mon, etc.) for a YYYY-MM-DD date.
 */
export function getDayOfWeekIndex(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
