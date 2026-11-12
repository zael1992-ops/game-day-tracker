// Kickoff time helpers for the New Game screen and game cards.

const QUARTER_HOUR_MS = 15 * 60 * 1000;

// Nearest 15-minute mark: 7:26 -> 7:30, 7:37 -> 7:30, 7:38 -> 7:45.
export function roundToQuarterHour(date = new Date()) {
  return new Date(Math.round(date.getTime() / QUARTER_HOUR_MS) * QUARTER_HOUR_MS);
}

// Value for an <input type="datetime-local">, in the device's local time.
export function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// "Nov 11, 2026, 7:30 PM"
export function formatKickoff(value) {
  return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}
