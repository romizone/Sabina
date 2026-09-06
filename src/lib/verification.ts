import { currentBalance, transactionsFor } from "./data/transactions";
import { isBankingText, isHardOffTopicMessage } from "./guardrail";
import { formatIdr } from "./money";
import type { ChatMessage, CustomerProfile } from "./types";

const MONTHS =
  "januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|agu|ags|sep|okt|oct|nov|des|dec";

const MONTH_NAME = new RegExp(`^(?:${MONTHS})$`, "i");
const DATE_WORD = new RegExp(String.raw`\b\d{1,2}\s+(?:${MONTHS})\.?\s+\d{2,4}\b`, "i");
const DATE_NUMERIC = /\b\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}\b/;
const DATE_ISO = /\b\d{4}[/\-.]\d{1,2}[/\-.]\d{1,2}\b/;

const VERIF_ASK =
  /tanggal lahir|tgl lahir|tgl\.?\s*lahir|ibu kandung|nama ibu|nama gadis|verifikasi|otentikasi|autentikasi|3 data|tiga data|mother maiden|tempat.?tanggal lahir|\bttl\b|data otentikasi/i;

const TIME_WINDOW_FOLLOWUP =
  /\b(barusan|baru saja|baru aja|semalam|tadi(?:\s+(?:pagi|siang|sore|malam))?|kemarin|hari ini|bulan ini|minggu (?:ini|lalu)|(?:\d+|satu|se|dua|tiga)\s*(?:jam|menit|hari|minggu|bulan)(?:\s+terakhir)?)\b/i;

const ASK_TX_DETAILS =
  /tanggal|jam\b|nominal|merchant|rrn|referen|bukti transaksi|nama toko|nama merchant/i;

const SALDO_INQUIRY = /\b(saldo|balance|posisi rekening|cek rekening|berapa uang)\b/i;

const NAME_NOISE =
  /\b(ibu(?:\s+kandung)?|nama(?:\s+(?:gadis|ibu))?|tanggal(?:\s+lahir)?|tgl|lahir|ttl|dob|tahun|thn|dan|yang|dengan|adalah|saya|aku)\b/gi;

export type MockVerification = {
  isFollowUp: boolean;
  priorQuery?: string;
};

export function hasDobToken(message: string): boolean {
  const text = message.trim();
  return DATE_WORD.test(text) || DATE_NUMERIC.test(text) || DATE_ISO.test(text);
}

export function hasMotherNameToken(message: string): boolean {
  const stripped = message
    .replace(DATE_WORD, " ")
    .replace(DATE_NUMERIC, " ")
    .replace(DATE_ISO, " ")
    .replace(NAME_NOISE, " ")
    .replace(/[0-9/\-.,;:()]+/g, " ")
    .trim();
  const tokens = stripped
    .split(/\s+/)
    .map((t) => t.replace(/^['"]+|['"]+$/g, ""))
    .filter((t) => /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'.]{1,}$/.test(t))
    .filter((t) => !MONTH_NAME.test(t));
  if (!tokens.length) return false;
  return tokens.some((t) => t.length >= 3) || tokens.join("").length >= 4;
}

export function looksLikeVerificationReply(message: string): boolean {
  const text = message.trim();
  if (!text || text.length > 180) return false;
  if (/\b(ignore (all|previous|above)|system prompt|jailbreak|developer mode)\b/i.test(text)) {
    return false;
  }
  if (isHardOffTopicMessage(text)) return false;
  return hasDobToken(text) && hasMotherNameToken(text);
}

function lastBankingUserQuery(prior: ChatMessage[]): string | undefined {
  for (let i = prior.length - 1; i >= 0; i -= 1) {
    const m = prior[i];
    if (m?.role === "user" && isBankingText(m.content)) {
      return m.content.trim();
    }
  }
  return undefined;
}

function lastUserIndex(messages: ChatMessage[]): number {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === "user") return i;
  }
  return -1;
}

export function looksLikeTimeWindowFollowUp(message: string): boolean {
  const text = message.trim();
  if (!text || text.length > 160) return false;
  if (/\b(ignore (all|previous|above)|system prompt|jailbreak|developer mode)\b/i.test(text)) {
    return false;
  }
  if (isHardOffTopicMessage(text)) return false;
  return TIME_WINDOW_FOLLOWUP.test(text);
}

export function resolveTimeWindowFollowUp(messages: ChatMessage[]): MockVerification {
  const lastUserIdx = lastUserIndex(messages);
  if (lastUserIdx < 0) return { isFollowUp: false };
  const last = messages[lastUserIdx]!;
  if (!looksLikeTimeWindowFollowUp(last.content)) return { isFollowUp: false };

  const prior = messages.slice(0, lastUserIdx);
  const priorQuery = lastBankingUserQuery(prior);
  const assistantAsked = prior.some((m) => m.role === "assistant" && ASK_TX_DETAILS.test(m.content));
  if (!priorQuery && !assistantAsked) {
    return { isFollowUp: false };
  }
  return {
    isFollowUp: true,
    priorQuery: priorQuery || "transaksi gagal",
  };
}

function assistantAskedVerification(prior: ChatMessage[]): boolean {
  return prior.some((m) => m.role === "assistant" && VERIF_ASK.test(m.content));
}

export function resolveMockVerification(messages: ChatMessage[]): MockVerification {
  const lastUserIdx = lastUserIndex(messages);
  if (lastUserIdx < 0) return { isFollowUp: false };
  const last = messages[lastUserIdx]!;
  if (!looksLikeVerificationReply(last.content)) return { isFollowUp: false };

  const prior = messages.slice(0, lastUserIdx);
  const priorQuery = lastBankingUserQuery(prior);
  if (!priorQuery && !assistantAskedVerification(prior)) {
    return { isFollowUp: false };
  }
  return {
    isFollowUp: true,
    priorQuery: priorQuery || "saldo tabungan",
  };
}

export function isSaldoInquiry(query: string): boolean {
  return SALDO_INQUIRY.test(query);
}

export function savingsBalanceLines(profile: CustomerProfile): string[] {
  const rows = transactionsFor(profile);
  return profile.savings
    .filter((a) => a.type === "savings")
    .map((a) => {
      const bal = currentBalance(rows, a.accountNo);
      return `- ${a.product} ${a.accountNo} (${a.status}) ${formatIdr(bal)}`;
    });
}

export function mockVerifiedInstruction(priorQuery: string): string {
  return [
    "=== VERIFIKASI MOCK BERHASIL ===",
    "Nasabah baru saja mengirim tanggal lahir + nama ibu kandung sebagai jawaban otentikasi.",
    "DEMO MOCKUP: terima SELALU. Jangan bandingkan dengan CIF.lahir / nama ibu kandung di data.",
    "Jangan minta ulang. Jangan tolak sebagai di luar tugas / non-perbankan.",
    `Lanjutkan pertanyaan perbankan sebelumnya: "${priorQuery}"`,
    "Jika pertanyaan itu tentang saldo, sampaikan saldo tabungan dari data SIMPANAN / baris saldo di bawah.",
  ].join("\n");
}

export function verifiedSavingsReply(profile: CustomerProfile): string {
  const lines = savingsBalanceLines(profile);
  const body = lines.length
    ? lines.join("\n")
    : "- Tidak ada rekening tabungan aktif pada CIF ini.";
  return `Baik ${profile.cif.name}, verifikasi demo sudah saya terima. Saldo tabungan Anda saat ini:

${body}

Silakan tanya mutasi, deposito, kartu, atau pinjaman jika perlu dicek juga.`;
}
