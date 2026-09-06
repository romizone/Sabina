import { formatIdDateTime, now, parseDateRange } from "../dates";
import { formatIdr } from "../money";
import type { BankTransaction, CustomerProfile, DateRange, TxType } from "../types";
import { transactionsFor } from "./transactions";

export type FailedTxChannel = "qris" | "atm" | "transfer";

export type FailedTxLookup = {
  channel?: FailedTxChannel;
  range: DateRange | null;
  windowHits: BankTransaction[];
  shown: BankTransaction[];
  windowEmpty: boolean;
  fewerThanRequested: boolean;
};

const FAILED_HINT =
  /\b(gagal|pending|ditolak|tidak (berhasil|masuk)|belum masuk|nyangkut|gak jadi|nggak jadi|gak berhasil|tidak terdebet|gagal bayar|error transaksi|transaksi error)\b/i;

const BANKING_HINT =
  /\b(qris|transfer|atm|transaksi|pembayaran|bayar|mutasi|rekening|merchant|rrn|bi-?fast|rtgs|skn)\b/i;

const QRIS_TYPES = new Set<TxType>(["qris"]);
const ATM_TYPES = new Set<TxType>(["atm_withdraw", "atm_transfer", "atm_deposit"]);
const TRANSFER_TYPES = new Set<TxType>(["bifast_in", "bifast_out", "skn", "rtgs"]);

export function isFailedTxInquiry(message: string): boolean {
  const text = message.trim();
  if (!text) return false;
  return FAILED_HINT.test(text) && BANKING_HINT.test(text);
}

export function detectFailedTxChannel(message: string): FailedTxChannel | undefined {
  const q = message.toLowerCase();
  if (/qris/.test(q)) return "qris";
  if (/\batm\b|tarik tunai/.test(q)) return "atm";
  if (/transfer|bi-?fast|rtgs|skn/.test(q)) return "transfer";
  return undefined;
}

function matchesChannel(tx: BankTransaction, channel?: FailedTxChannel): boolean {
  if (!channel) return true;
  if (channel === "qris") return QRIS_TYPES.has(tx.type) || /qris/i.test(tx.channel);
  if (channel === "atm") return ATM_TYPES.has(tx.type) || tx.channel === "ATM";
  return TRANSFER_TYPES.has(tx.type) || /bi-?fast|rtgs|skn/i.test(tx.channel);
}

function isFailed(tx: BankTransaction): boolean {
  return tx.status === "failed" || tx.status === "reversed";
}

function inRange(tx: BankTransaction, range: DateRange): boolean {
  return tx.bookedAt >= range.from.toISOString() && tx.bookedAt <= range.to.toISOString();
}

function newestFirst(rows: BankTransaction[]): BankTransaction[] {
  return [...rows].sort((a, b) => b.bookedAt.localeCompare(a.bookedAt));
}

export const FAILED_TX_LIMIT = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

function last24hRange(clock: Date): DateRange {
  return {
    from: new Date(clock.getTime() - DAY_MS),
    to: clock,
    label: "24 jam terakhir",
  };
}

export function lastFailedTransactions(
  profile: CustomerProfile,
  query: string,
  clock = now(),
  limit = FAILED_TX_LIMIT,
): FailedTxLookup {
  const channel = detectFailedTxChannel(query);
  const range = parseDateRange(query, clock);
  const day = last24hRange(clock);
  const allFailed = newestFirst(transactionsFor(profile, clock).filter(isFailed));
  const channelFailed = newestFirst(
    allFailed.filter((tx) => matchesChannel(tx, channel)),
  );
  const dayAll = allFailed.filter((tx) => inRange(tx, day));
  const dayChannel = channelFailed.filter((tx) => inRange(tx, day));
  const productSet = dayChannel.length >= limit || !dayAll.length ? dayChannel : dayAll;
  const pool = productSet.length ? productSet : channelFailed.length ? channelFailed : allFailed;
  const windowHits = range ? pool.filter((tx) => inRange(tx, range)) : [];
  const remainder = pool.filter((tx) => !windowHits.includes(tx));
  const shown = (range ? [...windowHits, ...remainder] : pool).slice(0, limit);

  return {
    channel,
    range,
    windowHits,
    shown,
    windowEmpty: Boolean(range && windowHits.length === 0),
    fewerThanRequested: shown.length < limit,
  };
}

function statusLabel(status: BankTransaction["status"]): string {
  if (status === "failed") return "gagal";
  if (status === "reversed") return "dibatalkan";
  if (status === "pending") return "pending";
  return status;
}

export function formatFailedTxLine(tx: BankTransaction, index: number): string {
  const amount = tx.credit > 0 ? formatIdr(tx.credit) : formatIdr(tx.debit);
  const who = tx.merchant || tx.location;
  const where =
    !who
      ? tx.channel
      : who.toLowerCase().startsWith(tx.channel.toLowerCase())
        ? who
        : `${tx.channel} ${who}`;
  const reason = tx.failReason ? ` — ${tx.failReason}` : "";
  return `${index}. ${formatIdDateTime(new Date(tx.bookedAt))} · ${where} · ${amount} · ${statusLabel(tx.status)}${reason}`;
}

function channelLabel(channel?: FailedTxChannel): string {
  if (channel === "qris") return "QRIS";
  if (channel === "atm") return "ATM";
  if (channel === "transfer") return "transfer";
  return "transaksi";
}

export function formatFailedTxReply(profile: CustomerProfile, query: string, clock = now()): string {
  const lookup = lastFailedTransactions(profile, query, clock, FAILED_TX_LIMIT);
  const mixed =
    lookup.shown.some((tx) => lookup.channel && !matchesChannel(tx, lookup.channel));
  const label = mixed ? "transaksi" : channelLabel(lookup.channel);
  const who = profile.cif.name.split(" ")[0] ?? profile.cif.name;
  const lines = lookup.shown.map((tx, i) => formatFailedTxLine(tx, i + 1));

  if (!lookup.shown.length) {
    return `Baik ${who}, saya sudah cek mutasi CIF Anda. Tidak ada ${label} gagal yang tercatat di ledger demo. Kalau ada bukti lain, silakan kirim — RRN atau nama merchant bersifat opsional.`;
  }

  const inWindow = lookup.windowHits.length;
  const windowNote = lookup.range
    ? lookup.windowEmpty
      ? `Dalam ${lookup.range.label} tidak ada ${label} gagal. Berikut ${lookup.shown.length} kegagalan ${label} dalam 24 jam terakhir di rekening Anda:`
      : inWindow < lookup.shown.length
        ? `Dalam ${lookup.range.label} ada ${inWindow} ${label} gagal. Berikut ${lookup.shown.length} kegagalan ${label} dalam 24 jam terakhir (yang cocok jendela waktu diurutkan di atas):`
        : `Berikut ${lookup.shown.length} ${label} gagal pada ${lookup.range.label}:`
    : `Berikut ${lookup.shown.length} ${label} gagal dalam 24 jam terakhir di rekening Anda:`;

  const shortNote = lookup.fewerThanRequested
    ? `\n\nLedger demo hanya punya ${lookup.shown.length} ${label} gagal yang cocok — itu semua yang tercatat.`
    : "";

  return `Baik ${who}, nasabah demo ini sudah terotentikasi jadi saya langsung cek mutasi — tidak perlu RRN atau nama merchant dulu.

${windowNote}

${lines.join("\n")}
${shortNote}

Saldo tidak terpotong pada transaksi gagal ini. Kalau mau saya telusuri satu baris atau buka tiket, sebut saja yang mana.`;
}
