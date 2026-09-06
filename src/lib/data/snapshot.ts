import { formatIdDate, formatIdDateTime, now, parseDateRange, defaultMutasiRange } from "../dates";
import { formatIdr } from "../money";
import type {
  BankTransaction,
  CustomerProfile,
  DateRange,
  TxType,
} from "../types";
import { describeDeposit } from "./deposit";
import { installment } from "./loan-math";
import {
  currentBalance,
  filterTransactions,
  transactionsFor,
  wealthMarketValue,
} from "./transactions";

const ATM_TYPES: TxType[] = ["atm_withdraw", "atm_transfer", "atm_deposit"];

export function detectTypes(message: string): TxType[] | undefined {
  const q = message.toLowerCase();
  if (/\batm\b|tarik tunai|setor tunai/.test(q)) return ATM_TYPES;
  if (/qris/.test(q)) return ["qris"];
  if (/kartu kredit|tagihan kartu|cc\b/.test(q)) {
    return ["cc_purchase", "cc_payment", "cc_cash_advance", "cc_interest"];
  }
  if (/pinjam|pinjem|minjem|kpr|kta|kkb|kur|angsuran|syarat/.test(q)) {
    return ["loan_disburse", "loan_installment"];
  }
  if (/invest|reksa|wealth|obligasi|dividen/.test(q)) {
    return ["wealth_buy", "wealth_sell", "wealth_dividend"];
  }
  return undefined;
}

export function resolveRange(message: string): DateRange {
  return parseDateRange(message) ?? defaultMutasiRange();
}

export function wantsMutasi(message: string): boolean {
  return /mutasi|transaksi|riwayat|history|10 tahun|sepuluh tahun|atm|qris|tarik/.test(
    message.toLowerCase(),
  );
}

function txLine(tx: BankTransaction): string {
  const signed = tx.credit > 0 ? `+${formatIdr(tx.credit)}` : `-${formatIdr(tx.debit)}`;
  const reason = tx.failReason ? ` | alasan ${tx.failReason}` : "";
  return `${formatIdDateTime(new Date(tx.bookedAt))} | ${tx.accountNo} | ${tx.type} | ${tx.description} | ${signed} | saldo ${formatIdr(tx.balanceAfter)} | ${tx.status} | ${tx.reference}${reason}`;
}

export function buildCustomerContext(
  profile: CustomerProfile,
  message: string,
  clock = now(),
): { text: string; rangeLabel: string; sampleCount: number } {
  const rows = transactionsFor(profile, clock);
  const range = resolveRange(message);
  const types = detectTypes(message);
  const detailed = filterTransactions(rows, {
    from: range.from,
    to: range.to,
    types,
    limit: 40,
  });

  const savingsLines = profile.savings.map((a) => {
    const bal = currentBalance(rows, a.accountNo);
    const deposit = a.type === "deposit" ? ` | ${describeDeposit(a, clock)}` : "";
    return `- ${a.product} ${a.accountNo} (${a.type}, ${a.status}) saldo ${formatIdr(bal)} bunga ${(a.interestRate * 100).toFixed(2)}% buka ${a.openedOn}${deposit}`;
  });

  const loanLines = profile.loans.map((l) => {
    const pay = installment(l);
    const started = new Date(l.startedOn);
    const elapsed =
      (clock.getFullYear() - started.getFullYear()) * 12 +
      (clock.getMonth() - started.getMonth());
    const remaining = Math.max(0, l.tenorMonths - elapsed);
    const outstanding = remaining * pay;
    return `- ${l.product} ${l.accountNo} pokok ${formatIdr(l.principal)} tenor ${l.tenorMonths} bln rate ${(l.annualRate * 100).toFixed(2)}% angsuran ${formatIdr(pay)}/bln sisa ±${remaining} bln outstanding ±${formatIdr(outstanding)} status ${l.status} mulai ${l.startedOn}${l.collateral ? ` jaminan ${l.collateral}` : ""}`;
  });

  const cardLines = profile.cards.map((c) => {
    const monthRows = filterTransactions(rows, {
      from: new Date(clock.getFullYear(), clock.getMonth(), 1),
      to: clock,
      accountNo: `CC${c.last4}`,
    });
    const spend = monthRows
      .filter((t) => t.type === "cc_purchase" || t.type === "cc_cash_advance")
      .reduce((s, t) => s + t.debit, 0);
    const paid = monthRows
      .filter((t) => t.type === "cc_payment")
      .reduce((s, t) => s + t.credit, 0);
    return `- ${c.product} ${c.cardNoMasked} limit ${formatIdr(c.limit)} jatuh tempo tgl ${c.dueDay} belanja bulan ini ${formatIdr(spend)} sudah dibayar ${formatIdr(paid)} outstanding ±${formatIdr(Math.max(0, spend - paid))} status ${c.status} autodebet ${c.paymentAccountNo}`;
  });

  const wealthLines = profile.wealth.map((w) => {
    const value = wealthMarketValue(w, clock);
    return `- ${w.product} (${w.kind}, risiko ${w.risk}) unit ${w.units.toLocaleString("id-ID")} nilai pasar ±${formatIdr(value)} beli ${w.boughtOn}`;
  });

  const recent = filterTransactions(rows, { limit: 12 });
  const failedRecent = [...rows]
    .filter((t) => t.status === "failed" || t.status === "reversed")
    .filter((t) => t.bookedAt >= new Date(clock.getTime() - 24 * 60 * 60 * 1000).toISOString())
    .sort((a, b) => b.bookedAt.localeCompare(a.bookedAt))
    .slice(0, 5);

  const text = [
    `Waktu sistem (compute): ${clock.toISOString()}`,
    `Jendela transaksi mockup: ${TRANSACTION_WINDOW()}`,
    "",
    "=== CIF ===",
    `Nama: ${profile.cif.name}`,
    `CIF: ${profile.cif.cif}`,
    `Lahir: ${profile.cif.dob} di ${profile.cif.pob}`,
    `NIK: ${profile.cif.nikMasked}`,
    `NPWP: ${profile.cif.npwpMasked}`,
    `Alamat: ${profile.cif.address}, ${profile.cif.city}`,
    `HP: ${profile.cif.phone} | Email: ${profile.cif.email}`,
    `Segmen: ${profile.cif.segment} | KYC: ${profile.cif.kycStatus} | Risiko: ${profile.cif.riskRating}`,
    `Nasabah sejak: ${profile.cif.openedOn} | Cabang: ${profile.cif.branch}`,
    `Pekerjaan: ${profile.cif.occupation} | Nama gadis ibu kandung: ${profile.cif.motherMaiden}`,
    "",
    "=== SIMPANAN ===",
    ...savingsLines,
    "",
    "=== PINJAMAN ===",
    ...(loanLines.length ? loanLines : ["- Tidak ada fasilitas pinjaman aktif"]),
    "",
    "=== KARTU KREDIT ===",
    ...(cardLines.length ? cardLines : ["- Tidak ada kartu kredit"]),
    "",
    "=== WEALTH MANAGEMENT ===",
    ...(wealthLines.length ? wealthLines : ["- Tidak ada posisi investasi"]),
    "",
    `=== TRANSAKSI PADA RENTANG ${range.label.toUpperCase()} (${formatIdDate(range.from)} s.d. ${formatIdDate(range.to)}) ===`,
    `Jumlah baris dikirim: ${detailed.length}`,
    ...detailed.map(txLine),
    "",
    "=== TRANSAKSI GAGAL TERAKHIR (langsung sampaikan bila nasabah tanya gagal/QRIS/transfer) ===",
    ...(failedRecent.length
      ? failedRecent.map(txLine)
      : ["- Tidak ada transaksi gagal pada ledger ini."]),
    "Nasabah sesi sudah terotentikasi. Jangan minta RRN/merchant sebelum menyebut 5 gagal dalam 24 jam terakhir di atas.",
    "",
    "=== 12 TRANSAKSI TERAKHIR (semua produk) ===",
    ...recent.map(txLine),
  ].join("\n");

  return { text, rangeLabel: range.label, sampleCount: detailed.length };
}

function TRANSACTION_WINDOW(): string {
  const clock = now();
  const start = new Date(clock);
  start.setFullYear(start.getFullYear() - 10);
  return `${formatIdDate(start)} s.d. ${formatIdDate(clock)} (10 tahun, selalu current)`;
}

export { installment };
