/**
 * Safely parses and formats YYYY-MM-DD date strings in local timezone
 * avoiding off-by-one UTC shift issues.
 */
export function formatLocalDate(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" },
): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return dateStr;
  }
  const [year, month, day] = parts;
  const localDate = new Date(year, month - 1, day);
  return localDate.toLocaleDateString("en-US", options);
}

export function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return new Date(dateStr);
  }
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
}
