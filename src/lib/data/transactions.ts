import { TRANSACTION_LOOKBACK_YEARS } from "../config";
import { addYears, eachMonth, isoDateTime, lookbackStart, now } from "../dates";
import { amount, createRng, pad, pick } from "../rng";
import type {
  BankTransaction,
  CreditCard,
  CustomerProfile,
  LoanAccount,
  SavingsAccount,
  TxType,
  WealthPosition,
} from "../types";

const ATM_LOCS = [
  "ATM Bang Digital Senayan",
  "ATM Bang Digital Sudirman",
  "ATM Bang Digital Dago",
  "ATM Bang Digital Darmo",
  "ATM Bang Digital Margonda",
  "ATM Bang Digital Malioboro",
  "ATM Bang Digital Polonia",
  "ATM Prima Mall Kota",
  "ATM Bersama SPBU",
  "CRM Bang Digital",
] as const;

const QRIS_MERCHANTS = [
  "Kopi Kenangan",
  "Sate Khas Senayan",
  "Alfamart",
  "Indomaret",
  "Grab",
  "Gojek",
  "Shopee",
  "Tokopedia",
  "KFC",
  "Starbucks",
  "RS Siloam",
  "APOTEK K-24",
  "SPBU Shell",
  "Cinema XXI",
  "Transmart",
] as const;

const DEBIT_MERCHANTS = [
  "Superindo",
  "Farmers Market",
  "Uniqlo",
  "IKEA",
  "Decathlon",
  "Gramedia",
  "Guardian",
] as const;

const BILLERS = [
  "PLN Pascabayar",
  "PDAM",
  "Telkom IndiHome",
  "BPJS Kesehatan",
  "Token Listrik",
] as const;

const EWALLETS = ["GoPay", "OVO", "DANA", "ShopeePay", "LinkAja"] as const;

function txTime(
  year: number,
  month: number,
  day: number,
  rng: () => number,
): Date {
  const last = new Date(year, month + 1, 0).getDate();
  const d = Math.min(day, last);
  const hour = 7 + Math.floor(rng() * 14);
  const minute = Math.floor(rng() * 60);
  return new Date(year, month, d, hour, minute, Math.floor(rng() * 60));
}

function makeId(cif: string, accountNo: string, at: Date, seq: number): string {
  return `TRX${cif.slice(-4)}${accountNo.slice(-4)}${at.getFullYear()}${pad(at.getMonth() + 1, 2)}${pad(at.getDate(), 2)}${pad(seq, 3)}`;
}

function ref(rng: () => number): string {
  return `BD${Math.floor(rng() * 9e11 + 1e11)}`;
}

function pushTx(
  list: BankTransaction[],
  partial: Omit<BankTransaction, "id" | "balanceAfter"> & { seq: number },
  running: { balance: number },
): void {
  const signed = partial.credit - partial.debit;
  running.balance += signed;
  list.push({
    id: makeId(partial.cif, partial.accountNo, new Date(partial.bookedAt), partial.seq),
    bookedAt: partial.bookedAt,
    accountNo: partial.accountNo,
    cif: partial.cif,
    type: partial.type,
    channel: partial.channel,
    description: partial.description,
    merchant: partial.merchant,
    location: partial.location,
    debit: partial.debit,
    credit: partial.credit,
    balanceAfter: Math.max(0, Math.round(running.balance)),
    status: partial.status,
    reference: partial.reference,
  });
}

function savingsOpening(account: SavingsAccount): number {
  if (account.type === "deposit") return account.monthlyAvgTarget;
  if (account.type === "giro") return account.monthlyAvgTarget * 0.45;
  return account.monthlyAvgTarget * 0.35;
}

function generateSavingsMonth(
  profile: CustomerProfile,
  account: SavingsAccount,
  year: number,
  month: number,
  clock: Date,
): BankTransaction[] {
  const opened = new Date(account.openedOn);
  const monthStart = new Date(year, month, 1);
  if (monthStart < new Date(opened.getFullYear(), opened.getMonth(), 1)) return [];
  if (monthStart > clock) return [];

  const rng = createRng(`${profile.cif.cif}:${account.accountNo}:${year}-${month}`);
  const list: BankTransaction[] = [];
  const running = { balance: 0 };
  let seq = 1;
  const cif = profile.cif.cif;

  const isFirst =
    year === opened.getFullYear() && month === opened.getMonth();
  if (isFirst) {
    const at = txTime(year, month, opened.getDate(), rng);
    pushTx(
      list,
      {
        seq: seq++,
        bookedAt: isoDateTime(at),
        accountNo: account.accountNo,
        cif,
        type: "atm_deposit",
        channel: "Cabang",
        description: `Setoran awal ${account.product}`,
        credit: savingsOpening(account),
        debit: 0,
        status: "success",
        reference: ref(rng),
      },
      running,
    );
  }

  if (account.type === "deposit") {
    if (month % 3 === 0) {
      const at = txTime(year, month, 5, rng);
      const bunga = Math.round(account.monthlyAvgTarget * account.interestRate / 12);
      pushTx(
        list,
        {
          seq: seq++,
          bookedAt: isoDateTime(at),
          accountNo: account.accountNo,
          cif,
          type: "interest",
          channel: "Sistem",
          description: `Bunga ${account.product}`,
          credit: bunga,
          debit: 0,
          status: "success",
          reference: ref(rng),
        },
        running,
      );
    }
    return list;
  }

  const payday = 25;
  const salary =
    profile.cif.segment === "priority"
      ? amount(rng, 28_000_000, 55_000_000, 500_000)
      : profile.cif.segment === "affluent"
        ? amount(rng, 18_000_000, 35_000_000, 500_000)
        : profile.cif.segment === "sme"
          ? amount(rng, 40_000_000, 95_000_000, 1_000_000)
          : amount(rng, 8_000_000, 18_000_000, 250_000);

  if (account.type === "giro" || account.product.includes("Digital")) {
    pushTx(
      list,
      {
        seq: seq++,
        bookedAt: isoDateTime(txTime(year, month, payday, rng)),
        accountNo: account.accountNo,
        cif,
        type: "salary",
        channel: "BI-FAST",
        description:
          account.type === "giro"
            ? "Penerimaan usaha / invoice"
            : `Gaji ${profile.cif.name.split(" ")[0]}`,
        credit: salary,
        debit: 0,
        status: "success",
        reference: ref(rng),
      },
      running,
    );
  }

  if (month === 0 || rng() < 0.15) {
    pushTx(
      list,
      {
        seq: seq++,
        bookedAt: isoDateTime(txTime(year, month, 2, rng)),
        accountNo: account.accountNo,
        cif,
        type: "interest",
        channel: "Sistem",
        description: "Bunga simpanan",
        credit: amount(rng, 8_000, 85_000, 1000),
        debit: 0,
        status: "success",
        reference: ref(rng),
      },
      running,
    );
  }

  if (month % 3 === 0) {
    pushTx(
      list,
      {
        seq: seq++,
        bookedAt: isoDateTime(txTime(year, month, 1, rng)),
        accountNo: account.accountNo,
        cif,
        type: "admin_fee",
        channel: "Sistem",
        description: "Biaya administrasi rekening",
        debit: account.type === "giro" ? 25_000 : 11_000,
        credit: 0,
        status: "success",
        reference: ref(rng),
      },
      running,
    );
  }

  const atmCount = 2 + Math.floor(rng() * (profile.cif.segment === "personal" ? 6 : 3));
  for (let i = 0; i < atmCount; i += 1) {
    const loc = pick(rng, ATM_LOCS);
    const withdraw = rng() > 0.18;
    pushTx(
      list,
      {
        seq: seq++,
        bookedAt: isoDateTime(txTime(year, month, 3 + i * 4, rng)),
        accountNo: account.accountNo,
        cif,
        type: withdraw ? "atm_withdraw" : "atm_transfer",
        channel: "ATM",
        description: withdraw
          ? `Tarik tunai ${loc}`
          : `Transfer ATM ke rekening tujuan`,
        location: loc,
        debit: withdraw
          ? amount(rng, 200_000, 2_500_000, 50_000)
          : amount(rng, 250_000, 5_000_000, 50_000),
        credit: 0,
        status: rng() > 0.03 ? "success" : "failed",
        reference: ref(rng),
      },
      running,
    );
  }

  const qrisCount = 4 + Math.floor(rng() * 8);
  for (let i = 0; i < qrisCount; i += 1) {
    const merchant = pick(rng, QRIS_MERCHANTS);
    pushTx(
      list,
      {
        seq: seq++,
        bookedAt: isoDateTime(txTime(year, month, 2 + i * 2, rng)),
        accountNo: account.accountNo,
        cif,
        type: "qris",
        channel: "QRIS",
        description: `QRIS ${merchant}`,
        merchant,
        debit: amount(rng, 18_000, 650_000, 1000),
        credit: 0,
        status: "success",
        reference: ref(rng),
      },
      running,
    );
  }

  const debitCount = 1 + Math.floor(rng() * 3);
  for (let i = 0; i < debitCount; i += 1) {
    const merchant = pick(rng, DEBIT_MERCHANTS);
    pushTx(
      list,
      {
        seq: seq++,
        bookedAt: isoDateTime(txTime(year, month, 6 + i * 7, rng)),
        accountNo: account.accountNo,
        cif,
        type: "debit_purchase",
        channel: "EDC Debit",
        description: `Debit ${merchant}`,
        merchant,
        debit: amount(rng, 85_000, 1_800_000, 5000),
        credit: 0,
        status: "success",
        reference: ref(rng),
      },
      running,
    );
  }

  if (rng() > 0.35) {
    const wallet = pick(rng, EWALLETS);
    pushTx(
      list,
      {
        seq: seq++,
        bookedAt: isoDateTime(txTime(year, month, 9, rng)),
        accountNo: account.accountNo,
        cif,
        type: "ewallet_topup",
        channel: "Aplikasi Bang",
        description: `Top up ${wallet}`,
        merchant: wallet,
        debit: amount(rng, 50_000, 750_000, 50_000),
        credit: 0,
        status: "success",
        reference: ref(rng),
      },
      running,
    );
  }

  if (rng() > 0.25) {
    const biller = pick(rng, BILLERS);
    pushTx(
      list,
      {
        seq: seq++,
        bookedAt: isoDateTime(txTime(year, month, 8, rng)),
        accountNo: account.accountNo,
        cif,
        type: "bill_payment",
        channel: "Aplikasi Bang",
        description: `Bayar ${biller}`,
        merchant: biller,
        debit: amount(rng, 150_000, 1_200_000, 1000),
        credit: 0,
        status: "success",
        reference: ref(rng),
      },
      running,
    );
  }

  if (rng() > 0.55) {
    const inbound = rng() > 0.4;
    pushTx(
      list,
      {
        seq: seq++,
        bookedAt: isoDateTime(txTime(year, month, 14, rng)),
        accountNo: account.accountNo,
        cif,
        type: inbound ? "bifast_in" : "bifast_out",
        channel: "BI-FAST",
        description: inbound
          ? "Transfer masuk BI-FAST"
          : "Transfer keluar BI-FAST",
        debit: inbound ? 0 : amount(rng, 200_000, 8_000_000, 50_000),
        credit: inbound ? amount(rng, 200_000, 12_000_000, 50_000) : 0,
        status: "success",
        reference: ref(rng),
      },
      running,
    );
  }

  if (account.type === "giro" && rng() > 0.4) {
    pushTx(
      list,
      {
        seq: seq++,
        bookedAt: isoDateTime(txTime(year, month, 11, rng)),
        accountNo: account.accountNo,
        cif,
        type: rng() > 0.5 ? "rtgs" : "skn",
        channel: rng() > 0.5 ? "RTGS" : "SKN",
        description: "Pembayaran supplier",
        debit: amount(rng, 5_000_000, 40_000_000, 100_000),
        credit: 0,
        status: "success",
        reference: ref(rng),
      },
      running,
    );
  }

  if (month === 2) {
    pushTx(
      list,
      {
        seq: seq++,
        bookedAt: isoDateTime(txTime(year, month, 20, rng)),
        accountNo: account.accountNo,
        cif,
        type: "tax",
        channel: "DJP",
        description: "Pembayaran PPh / e-billing",
        debit: amount(rng, 250_000, 4_500_000, 50_000),
        credit: 0,
        status: "success",
        reference: ref(rng),
      },
      running,
    );
  }

  return list;
}

function installment(loan: LoanAccount): number {
  const r = loan.annualRate / 12;
  const n = loan.tenorMonths;
  if (r === 0) return loan.principal / n;
  return Math.round(
    (loan.principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1),
  );
}

function generateLoanMonth(
  profile: CustomerProfile,
  loan: LoanAccount,
  year: number,
  month: number,
  clock: Date,
): BankTransaction[] {
  const started = new Date(loan.startedOn);
  const monthStart = new Date(year, month, 1);
  if (monthStart > clock) return [];
  const end = addYears(started, Math.ceil(loan.tenorMonths / 12) + 1);
  if (monthStart > end) return [];

  const rng = createRng(`${profile.cif.cif}:loan:${loan.accountNo}:${year}-${month}`);
  const list: BankTransaction[] = [];
  const running = { balance: 0 };
  let seq = 1;
  const cif = profile.cif.cif;
  const pay = installment(loan);

  if (year === started.getFullYear() && month === started.getMonth()) {
    pushTx(
      list,
      {
        seq: seq++,
        bookedAt: isoDateTime(txTime(year, month, started.getDate(), rng)),
        accountNo: loan.accountNo,
        cif,
        type: "loan_disburse",
        channel: "Pencairan",
        description: `Pencairan ${loan.product}`,
        credit: loan.principal,
        debit: 0,
        status: "success",
        reference: ref(rng),
      },
      running,
    );
  }

  const elapsed =
    (year - started.getFullYear()) * 12 + (month - started.getMonth());
  if (elapsed >= 1 && elapsed <= loan.tenorMonths) {
    const late = loan.status === "late" && elapsed > loan.tenorMonths - 4;
    pushTx(
      list,
      {
        seq: seq++,
        bookedAt: isoDateTime(txTime(year, month, 10, rng)),
        accountNo: loan.accountNo,
        cif,
        type: "loan_installment",
        channel: "Autodebet",
        description: `Angsuran ${loan.product} ke-${elapsed}`,
        debit: pay,
        credit: 0,
        status: late ? "pending" : "success",
        reference: ref(rng),
      },
      running,
    );
  }

  return list;
}

const CC_MERCHANTS = [
  "Tokopedia",
  "Shopee",
  "Traveloka",
  "Garuda Indonesia",
  "Hotel Santika",
  "Sociolla",
  "Apple Store",
  "Restoran Union",
  "CGV",
  "Ikea",
] as const;

function generateCardMonth(
  profile: CustomerProfile,
  card: CreditCard,
  year: number,
  month: number,
  clock: Date,
): BankTransaction[] {
  const opened = new Date(card.openedOn);
  const monthStart = new Date(year, month, 1);
  if (monthStart < new Date(opened.getFullYear(), opened.getMonth(), 1)) return [];
  if (monthStart > clock) return [];

  const rng = createRng(`${profile.cif.cif}:cc:${card.last4}:${year}-${month}`);
  const list: BankTransaction[] = [];
  const running = { balance: 0 };
  let seq = 1;
  const cif = profile.cif.cif;
  const spendCount = 3 + Math.floor(rng() * 6);
  let spend = 0;

  for (let i = 0; i < spendCount; i += 1) {
    const merchant = pick(rng, CC_MERCHANTS);
    const debit = amount(
      rng,
      120_000,
      card.brand === "platinum" ? 6_000_000 : 1_800_000,
      5000,
    );
    spend += debit;
    pushTx(
      list,
      {
        seq: seq++,
        bookedAt: isoDateTime(txTime(year, month, 2 + i * 4, rng)),
        accountNo: `CC${card.last4}`,
        cif,
        type: "cc_purchase",
        channel: "Kartu Kredit",
        description: `${card.product} • ${merchant}`,
        merchant,
        debit,
        credit: 0,
        status: "success",
        reference: ref(rng),
      },
      running,
    );
  }

  if (rng() > 0.85) {
    const debit = amount(rng, 500_000, 2_000_000, 100_000);
    spend += debit;
    pushTx(
      list,
      {
        seq: seq++,
        bookedAt: isoDateTime(txTime(year, month, 18, rng)),
        accountNo: `CC${card.last4}`,
        cif,
        type: "cc_cash_advance",
        channel: "ATM",
        description: `Tarik tunai ${card.product}`,
        debit,
        credit: 0,
        status: "success",
        reference: ref(rng),
      },
      running,
    );
  }

  const payRatio = card.status === "late" ? 0.35 : 0.65 + rng() * 0.35;
  const payment = Math.round(Math.min(spend, spend * payRatio));
  if (payment > 0) {
    pushTx(
      list,
      {
        seq: seq++,
        bookedAt: isoDateTime(txTime(year, month, card.dueDay, rng)),
        accountNo: `CC${card.last4}`,
        cif,
        type: "cc_payment",
        channel: "Autodebet",
        description: `Pembayaran tagihan ${card.product}`,
        debit: 0,
        credit: payment,
        status: card.status === "late" ? "pending" : "success",
        reference: ref(rng),
      },
      running,
    );
  }

  if (payRatio < 0.95) {
    pushTx(
      list,
      {
        seq: seq++,
        bookedAt: isoDateTime(txTime(year, month, Math.min(28, card.dueDay + 3), rng)),
        accountNo: `CC${card.last4}`,
        cif,
        type: "cc_interest",
        channel: "Sistem",
        description: "Bunga & biaya kartu kredit",
        debit: amount(rng, 25_000, 420_000, 1000),
        credit: 0,
        status: "success",
        reference: ref(rng),
      },
      running,
    );
  }

  return list;
}

function navNow(position: WealthPosition, clock: Date): number {
  const bought = new Date(position.boughtOn);
  const months =
    (clock.getFullYear() - bought.getFullYear()) * 12 +
    (clock.getMonth() - bought.getMonth());
  const drift =
    position.kind === "rds"
      ? 0.006
      : position.kind === "rdpt"
        ? 0.0035
        : position.kind === "bond"
          ? 0.002
          : 0.0028;
  const rng = createRng(`${position.id}:nav`);
  const noise = 1 + (rng() - 0.5) * 0.04;
  return Math.round(position.navAtBuy * Math.pow(1 + drift, Math.max(0, months)) * noise);
}

function generateWealthMonth(
  profile: CustomerProfile,
  position: WealthPosition,
  year: number,
  month: number,
  clock: Date,
): BankTransaction[] {
  const bought = new Date(position.boughtOn);
  const monthStart = new Date(year, month, 1);
  if (monthStart < new Date(bought.getFullYear(), bought.getMonth(), 1)) return [];
  if (monthStart > clock) return [];

  const rng = createRng(`${position.id}:${year}-${month}`);
  const list: BankTransaction[] = [];
  const running = { balance: 0 };
  let seq = 1;
  const cif = profile.cif.cif;

  if (year === bought.getFullYear() && month === bought.getMonth()) {
    pushTx(
      list,
      {
        seq: seq++,
        bookedAt: isoDateTime(txTime(year, month, bought.getDate(), rng)),
        accountNo: position.id,
        cif,
        type: "wealth_buy",
        channel: "BangInvest",
        description: `Subscription ${position.product}`,
        debit: Math.round(position.units * position.navAtBuy),
        credit: 0,
        status: "success",
        reference: ref(rng),
      },
      running,
    );
  }

  if (month === 5 || month === 11) {
    const nav = navNow(position, new Date(year, month, 15));
    pushTx(
      list,
      {
        seq: seq++,
        bookedAt: isoDateTime(txTime(year, month, 15, rng)),
        accountNo: position.id,
        cif,
        type: "wealth_dividend",
        channel: "BangInvest",
        description: `Dividen / hasil ${position.product}`,
        debit: 0,
        credit: Math.max(15_000, Math.round(position.units * nav * 0.008)),
        status: "success",
        reference: ref(rng),
      },
      running,
    );
  }

  if (rng() > 0.97 && position.kind !== "bancassurance") {
    const nav = navNow(position, new Date(year, month, 20));
    const units = Math.round(position.units * 0.08);
    pushTx(
      list,
      {
        seq: seq++,
        bookedAt: isoDateTime(txTime(year, month, 20, rng)),
        accountNo: position.id,
        cif,
        type: "wealth_sell",
        channel: "BangInvest",
        description: `Redemption sebagian ${position.product}`,
        debit: 0,
        credit: Math.round(units * nav),
        status: "success",
        reference: ref(rng),
      },
      running,
    );
  }

  return list;
}

const cache = new Map<string, BankTransaction[]>();

function generateRaw(profile: CustomerProfile, clock: Date): BankTransaction[] {
  const start = lookbackStart(clock);
  const months = eachMonth(start, clock);
  const all: BankTransaction[] = [];

  for (const { year, month } of months) {
    for (const account of profile.savings) {
      all.push(...generateSavingsMonth(profile, account, year, month, clock));
    }
    for (const loan of profile.loans) {
      all.push(...generateLoanMonth(profile, loan, year, month, clock));
    }
    for (const card of profile.cards) {
      all.push(...generateCardMonth(profile, card, year, month, clock));
    }
    for (const pos of profile.wealth) {
      all.push(...generateWealthMonth(profile, pos, year, month, clock));
    }
  }

  return all.sort((a, b) => a.bookedAt.localeCompare(b.bookedAt));
}

function applyRunningBalances(rows: BankTransaction[]): BankTransaction[] {
  const bal = new Map<string, number>();
  return rows.map((row) => {
    const next = (bal.get(row.accountNo) ?? 0) + row.credit - row.debit;
    const safe = row.status === "failed" ? (bal.get(row.accountNo) ?? 0) : next;
    if (row.status !== "failed") bal.set(row.accountNo, safe);
    return { ...row, balanceAfter: Math.round(safe) };
  });
}

export function transactionsFor(profile: CustomerProfile, clock = now()): BankTransaction[] {
  const key = `${profile.cif.cif}:${clock.toISOString().slice(0, 10)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const rows = applyRunningBalances(generateRaw(profile, clock));
  cache.set(key, rows);
  return rows;
}

export function filterTransactions(
  rows: BankTransaction[],
  opts: {
    from?: Date;
    to?: Date;
    types?: TxType[];
    accountNo?: string;
    limit?: number;
  },
): BankTransaction[] {
  let list = rows;
  if (opts.from) {
    const fromIso = opts.from.toISOString();
    list = list.filter((t) => t.bookedAt >= fromIso);
  }
  if (opts.to) {
    const toIso = opts.to.toISOString();
    list = list.filter((t) => t.bookedAt <= toIso);
  }
  if (opts.accountNo) {
    list = list.filter(
      (t) => t.accountNo === opts.accountNo || t.accountNo.endsWith(opts.accountNo!),
    );
  }
  if (opts.types?.length) {
    list = list.filter((t) => opts.types!.includes(t.type));
  }
  if (opts.limit) {
    list = list.slice(-opts.limit);
  }
  return list;
}

export function currentBalance(rows: BankTransaction[], accountNo: string): number {
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    if (rows[i]!.accountNo === accountNo && rows[i]!.status !== "failed") {
      return rows[i]!.balanceAfter;
    }
  }
  return 0;
}

export function wealthMarketValue(position: WealthPosition, clock = now()): number {
  if (position.kind === "bancassurance") return position.navAtBuy;
  return Math.round(position.units * navNow(position, clock));
}

export const LOOKBACK_YEARS = TRANSACTION_LOOKBACK_YEARS;
