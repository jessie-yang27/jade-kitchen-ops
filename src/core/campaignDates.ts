// Deterministic date formatting for weekly campaign copy. Dates are always
// computed in code, never left to the AI — the same "the LLM never does
// arithmetic" principle from the grocery math (spec §5), extended to dates.

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!));
}

export function formatLongDate(iso: string, includeWeekday = true): string {
  const date = parseIsoDate(iso);
  const weekday = WEEKDAY_NAMES[date.getUTCDay()];
  const month = MONTH_NAMES[date.getUTCMonth()];
  return includeWeekday ? `${weekday}, ${month} ${date.getUTCDate()}` : `${month} ${date.getUTCDate()}`;
}

export function addDays(iso: string, days: number): string {
  const date = parseIsoDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Order deadline: the Friday before the Sunday fulfillment date, 11:59 PM. */
export function orderDeadlineLabel(weekOf: string): string {
  return `${formatLongDate(addDays(weekOf, -2))} at 11:59 PM`;
}

/** Fixed for now — easy to change in one place if the real window changes. */
export const FULFILLMENT_WINDOW = "4-6 PM";
