const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const rupiahPlain = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

const dayLabel = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const shortDate = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
});

const monthLabelFmt = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
});

export function formatRupiah(value: number): string {
  return rupiah.format(Math.round(value));
}

export function formatNumber(value: number): string {
  return rupiahPlain.format(Math.round(value));
}

export function formatDay(ts: number): string {
  return dayLabel.format(ts);
}

export function formatShortDate(ts: number): string {
  return shortDate.format(ts);
}

export function formatMonthYear(ts: number): string {
  return monthLabelFmt.format(ts);
}

/** `2026-09-30` in the user's local timezone, for <input type="date">. */
export function toDateInput(ts: number): string {
  const d = new Date(ts);
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

/** Parse `2026-09-30` as a local-time timestamp (noon avoids DST edges). */
export function fromDateInput(value: string): number {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return Date.now();
  return new Date(year, month - 1, day, 12, 0, 0, 0).getTime();
}

/** First and last millisecond of a month identified by `2026-09`. */
export function monthRange(monthKey: string): { from: number; to: number } {
  const [year, month] = monthKey.split("-").map(Number);
  return {
    from: new Date(year, month - 1, 1, 0, 0, 0, 0).getTime(),
    to: new Date(year, month, 1, 0, 0, 0, 0).getTime(),
  };
}

/** `2026-09` for a given timestamp in local time. */
export function toMonthKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}`;
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return toMonthKey(d.getTime());
}

export function monthKeyLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return formatMonthYear(new Date(year, month - 1, 1).getTime());
}

/** Short month name, e.g. `Sep`, for chart axes. */
export function monthShortLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { month: "short" }).format(
    new Date(year, month - 1, 1).getTime(),
  );
}

/** Two-letter weekday initials for the date badge. */
export function weekdayShort(ts: number): string {
  return new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(ts);
}
