import { TRANSACTION_LOOKBACK_YEARS } from "./config";
import type { DateRange } from "./types";

export function now(): Date {
  return new Date();
}

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function endOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

export function addMonths(date: Date, months: number): Date {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

export function addYears(date: Date, years: number): Date {
  const copy = new Date(date);
  copy.setFullYear(copy.getFullYear() + years);
  return copy;
}

export function yearsAgo(years: number, month = 0, day = 15): Date {
  const d = now();
  d.setMonth(month, day);
  d.setFullYear(d.getFullYear() - years);
  d.setHours(9, 0, 0, 0);
  return d;
}

export function lookbackStart(from = now()): Date {
  const start = addYears(from, -TRANSACTION_LOOKBACK_YEARS);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isoDateTime(date: Date): string {
  return date.toISOString();
}

export function formatIdDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatIdDateTime(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function eachMonth(from: Date, to: Date): { year: number; month: number }[] {
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);
  const months: { year: number; month: number }[] = [];
  while (cursor <= end) {
    months.push({ year: cursor.getFullYear(), month: cursor.getMonth() });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

const MONTHS: Record<string, number> = {
  januari: 0,
  februari: 1,
  maret: 2,
  april: 3,
  mei: 4,
  juni: 5,
  juli: 6,
  agustus: 7,
  september: 8,
  oktober: 9,
  november: 10,
  desember: 11,
};

export function parseDateRange(text: string, clock = now()): DateRange | null {
  const q = text.toLowerCase();
  const today = startOfDay(clock);

  if (/(hari ini|today)/.test(q)) {
    return { from: today, to: endOfDay(clock), label: "hari ini" };
  }
  if (/(kemarin|yesterday)/.test(q)) {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return { from: d, to: endOfDay(d), label: "kemarin" };
  }

  const dayMatch = q.match(/(\d{1,3})\s*hari/);
  if (dayMatch) {
    const n = Number(dayMatch[1]);
    const from = new Date(today);
    from.setDate(from.getDate() - n);
    return { from, to: endOfDay(clock), label: `${n} hari terakhir` };
  }

  const weekMatch = q.match(/(\d{1,2})\s*minggu/);
  if (weekMatch) {
    const n = Number(weekMatch[1]);
    const from = new Date(today);
    from.setDate(from.getDate() - n * 7);
    return { from, to: endOfDay(clock), label: `${n} minggu terakhir` };
  }

  const monthMatch = q.match(/(\d{1,2})\s*bulan/);
  if (monthMatch) {
    const n = Number(monthMatch[1]);
    return {
      from: addMonths(today, -n),
      to: endOfDay(clock),
      label: `${n} bulan terakhir`,
    };
  }

  const yearMatch = q.match(/(\d{1,2})\s*tahun/);
  if (yearMatch) {
    const n = Math.min(Number(yearMatch[1]), TRANSACTION_LOOKBACK_YEARS);
    return {
      from: addYears(today, -n),
      to: endOfDay(clock),
      label: `${n} tahun terakhir`,
    };
  }

  if (/(bulan ini|this month)/.test(q)) {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from, to: endOfDay(clock), label: "bulan ini" };
  }
  if (/(tahun ini)/.test(q)) {
    const from = new Date(today.getFullYear(), 0, 1);
    return { from, to: endOfDay(clock), label: "tahun ini" };
  }
  if (/(tahun lalu|tahun kemarin)/.test(q)) {
    const from = new Date(today.getFullYear() - 1, 0, 1);
    const to = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
    return { from, to, label: "tahun lalu" };
  }

  for (const [name, month] of Object.entries(MONTHS)) {
    if (q.includes(name)) {
      const yearHit = q.match(/(20\d{2})/);
      const year = yearHit ? Number(yearHit[1]) : today.getFullYear();
      const from = new Date(year, month, 1);
      const to = endOfDay(new Date(year, month + 1, 0));
      return { from, to, label: `${name} ${year}` };
    }
  }

  const yearOnly = q.match(/\b(20\d{2})\b/);
  if (yearOnly && /(tahun|mutasi|transaksi|riwayat)/.test(q)) {
    const year = Number(yearOnly[1]);
    return {
      from: new Date(year, 0, 1),
      to: endOfDay(new Date(year, 11, 31)),
      label: `tahun ${year}`,
    };
  }

  return null;
}

export function defaultMutasiRange(clock = now()): DateRange {
  return {
    from: addMonths(startOfDay(clock), -1),
    to: endOfDay(clock),
    label: "30 hari terakhir",
  };
}
