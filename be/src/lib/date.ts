const DAY_MS = 24 * 60 * 60 * 1000;

// Tanggal hari ini di Asia/Jakarta sebagai tengah malam UTC, cocok dengan kolom DATE.
export function today(): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
  return new Date(`${ymd}T00:00:00Z`);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

export function toYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}
