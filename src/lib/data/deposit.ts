import { addMonths, formatIdDate, now } from "../dates";
import type { SavingsAccount } from "../types";

export function nextMaturity(account: SavingsAccount, clock = now()): Date | null {
  if (account.type !== "deposit" || !account.tenorMonths) return null;
  let cursor = new Date(account.openedOn);
  cursor.setHours(9, 0, 0, 0);
  const tenor = account.tenorMonths;
  while (cursor <= clock) {
    cursor = addMonths(cursor, tenor);
  }
  return cursor;
}

export function lastRollover(account: SavingsAccount, clock = now()): Date | null {
  const next = nextMaturity(account, clock);
  if (!next || !account.tenorMonths) return null;
  return addMonths(next, -account.tenorMonths);
}

export function daysUntil(date: Date, clock = now()): number {
  return Math.ceil((date.getTime() - clock.getTime()) / 86_400_000);
}

export function describeDeposit(account: SavingsAccount, clock = now()): string {
  const next = nextMaturity(account, clock);
  if (!next) return `${account.product} ${account.accountNo}`;
  const days = daysUntil(next, clock);
  return [
    `${account.product} ${account.accountNo}`,
    `Nominal ±${account.monthlyAvgTarget.toLocaleString("id-ID")}`,
    `Bunga kontrak ${(account.interestRate * 100).toFixed(2)}% p.a.`,
    `Tenor ${account.tenorMonths} bulan | ARO: ${account.aro ? "ya" : "tidak"}`,
    `Buka: ${account.openedOn}`,
    `Jatuh tempo berikutnya: ${formatIdDate(next)} (${days} hari lagi)`,
  ].join(" | ");
}
