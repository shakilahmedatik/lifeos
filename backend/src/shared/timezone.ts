const ASIA_DHAKA_OFFSET = 6 * 60; // UTC+6, no DST

export function nowInDhaka(): Date {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + ASIA_DHAKA_OFFSET * 60000);
}

export function todayInDhaka(): string {
  return nowInDhaka().toISOString().split("T")[0];
}

export function nowIsoInDhaka(): string {
  return nowInDhaka().toISOString();
}
