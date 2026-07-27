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
export function getClientDateString(timezone?: string): string {
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Date().toLocaleDateString("sv-SE", { timeZone: tz });
}

export function getClientMonthString(timezone?: string): string {
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
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
