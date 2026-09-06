import { BANK_NAME } from "./config";
import type { ChatMessage, GuardDecision } from "./types";

export type OffTopicKind =
  | "retail"
  | "food"
  | "vendor"
  | "personal"
  | "code"
  | "entertainment"
  | "jailbreak"
  | "general";

const META =
  /\b(halo|hai|hi|hello|selamat (pagi|siang|sore|malam)|terima kasih|makasih|thanks|siapa kamu|siapa anda|kamu siapa|nama kamu|apa kabar)\b/i;

const BANKING_CORE =
  /\b(bank|rekening|tabungan|giro|deposito|saldo|mutasi|transaksi|transfer|bi-?fast|rtgs|skn|qris|atm|kartu|kredit|debit|pinjam|pinjem|minjem|pinjaman|ngutang|utang|cicil|cicilan|plafon|syarat|pengajuan|ajukan|duit|uang|miliar|milyar|juta|kpr|kta|kkb|kur|\bcc\b|angsuran|tagihan|limit|pin|otp|cif|ktp|npwp|invest|reksa(?:\s*dana)?|obligasi|wealth|bunga|admin|biaya|tarif|rate|jatuh tempo|lokasi|terdekat|cabang|kantor|crm|kurs|valas|valuta|usd|lps|ojk|promo|cashback|jam operasional|call center|contact|kontak|hubungi|tiket|pengaduan|komplain|fraud|phishing|blokir|unblokir|va\b|virtual account|paylater|asuransi|bang digital|nasabah|pencairan|statement|koran|nik|ibu kandung|pembayaran|merchant|rrn|slik|scoring|akad|ltv|dti|agunan|shm|hgb|chargeback|refund|settlement|simulasi|dokumen)\b/i;

const BANKING_ROLES =
  /\b(ao|account officer|rm|relationship manager|fo|front office|pinca|pimcab|pincapem|pimpinan cabang(?: pembantu)?|kaunit|ka unit|kepala (?:cabang|unit)|mantri(?:\s+kredit)?|teller|collector|underwriter|appraisal|appraiser|\bcs\b)\b/i;

const BANKING_APPOINTMENT =
  /\b(janji\s*temu|appointment|jadwal(?:kan)?|reservasi|lounge|antri(?:an)?|prioritas|kunjungan|temu(?:i|kan)?)\b/i;

const RETAIL =
  /\b(shampo|sampo|sabun|pasta gigi|deterjen|skincare|make ?up|lipstik|minyak goreng|beras|indomie|mie instan|susu formula|popok|harga barang|harga shampo|harga sampo|supermarket|minimarket|alfamart|indomaret|kasir|belanja harian|diskon toko|promo toko)\b/i;

const FOOD =
  /\b(resep|masak|memasak|masakan|kue|kopi racikan|menu makan|restoran resep|siomay|bakso|gorengan|nasi goreng)\b/i;

const VENDOR =
  /\b(penjual|jualan|pedagang|dagang|tukang|warung|kaki lima|jual siomay|jual bakso|bukannya kamu (jual|penjual))\b/i;

const PERSONAL =
  /\b(tinggal ?di ?mana|tinggal dimana|rumah kamu|rumah anda|alamat kamu|alamat anda|umur(mu| kamu)|usia(mu| kamu)|pacar|menikah|suami|istri|keluarga kamu|hobi kamu|kamu tidur|kamu makan)\b/i;

const CODE =
  /\b(coding|program(?:ming)?|python|javascript|typescript|source code|debug(ging)?|hack(?:ing)?|exploit|malware)\b/i;

const ENTERTAINMENT =
  /\b(puisi|pantun|lagu|film netflix|gossip|selebriti|zodiak|ramalan|judi|togel|slot)\b/i;

const OTHER_OFF =
  /\b(politik|pemilu|agama|khotbah|skripsi|pr sekolah|pekerjaan rumah|cuaca luar|senjata|bom|racun|nude|porn|sex)\b/i;

const JAILBREAK =
  /\b(ignore (all|previous|above)|system prompt|developer mode|jailbreak|pretend you are|kamu sekarang|lupakan instruksi|bypass)\b/i;

const WELCOME =
  /aku sabina.*live customer service|silakan tanya apa pun seputar layanan bank/i;

const APPOINTMENT_OFFER =
  /jadwal(?:kan)?|janji\s*temu|appointment|reservasi|lounge|kunjungan|ketemu|(?:temu(?:i|kan)?)\s+(?:ao|rm|fo|pinca)|mau saya (?:jadwalkan|buatkan)|kapan\s+(?:bisa|mau|anda|kita|cocok)|cabang\s+mana|hari\s+(?:apa|mana)|jam\s+berapa/i;

export function offTopicKind(message: string): OffTopicKind {
  const text = message.trim();
  if (JAILBREAK.test(text)) return "jailbreak";
  if (RETAIL.test(text)) return "retail";
  if (VENDOR.test(text)) return "vendor";
  if (FOOD.test(text)) return "food";
  if (PERSONAL.test(text)) return "personal";
  if (CODE.test(text)) return "code";
  if (ENTERTAINMENT.test(text)) return "entertainment";
  return "general";
}

function isHardOffTopic(text: string): boolean {
  return (
    RETAIL.test(text) ||
    FOOD.test(text) ||
    VENDOR.test(text) ||
    PERSONAL.test(text) ||
    CODE.test(text) ||
    ENTERTAINMENT.test(text) ||
    OTHER_OFF.test(text)
  );
}

export function isHardOffTopicMessage(text: string): boolean {
  return isHardOffTopic(text);
}

export function isJailbreakMessage(text: string): boolean {
  return JAILBREAK.test(text);
}

export function isBankingText(message: string): boolean {
  const text = message.trim();
  if (!text) return false;
  return BANKING_CORE.test(text) || BANKING_ROLES.test(text) || BANKING_APPOINTMENT.test(text);
}

export function isWelcomeAssistant(text: string): boolean {
  return WELCOME.test(text.trim());
}

export function assistantOfferedAppointment(text: string): boolean {
  const t = text.trim();
  if (!t || isWelcomeAssistant(t)) return false;
  return APPOINTMENT_OFFER.test(t);
}

export function isSubstantiveBankingAssistant(text: string): boolean {
  const t = text.trim();
  if (!t || isWelcomeAssistant(t)) return false;
  return isBankingText(t) || assistantOfferedAppointment(t);
}

export function lastUserIndex(messages: ChatMessage[]): number {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === "user") return i;
  }
  return -1;
}

export function priorChat(messages: ChatMessage[]): ChatMessage[] {
  const idx = lastUserIndex(messages);
  return idx < 0 ? [] : messages.slice(0, idx);
}

export function lastBankingQuery(prior: ChatMessage[]): string | undefined {
  for (let i = prior.length - 1; i >= 0; i -= 1) {
    const m = prior[i];
    if (m?.role === "user" && isBankingText(m.content)) return m.content.trim();
  }
  for (let i = prior.length - 1; i >= 0; i -= 1) {
    const m = prior[i];
    if (m?.role === "assistant" && isSubstantiveBankingAssistant(m.content)) {
      return m.content.trim().slice(0, 280);
    }
  }
  return undefined;
}

export function hasBankingThread(prior: ChatMessage[]): boolean {
  return prior.some((m) =>
    m.role === "user"
      ? isBankingText(m.content)
      : isSubstantiveBankingAssistant(m.content),
  );
}

export type BankingFollowUp = {
  isFollowUp: boolean;
  priorQuery?: string;
};

export function resolveBankingFollowUp(messages: ChatMessage[]): BankingFollowUp {
  const idx = lastUserIndex(messages);
  if (idx < 0) return { isFollowUp: false };
  const last = messages[idx]!;
  const prior = messages.slice(0, idx);
  if (JAILBREAK.test(last.content)) return { isFollowUp: false };
  if (isHardOffTopic(last.content) && !isBankingText(last.content)) {
    return { isFollowUp: false };
  }
  if (!hasBankingThread(prior)) return { isFollowUp: false };
  return {
    isFollowUp: true,
    priorQuery: lastBankingQuery(prior),
  };
}

export function classifyGuard(
  message: string,
  hasImage: boolean,
  prior: ChatMessage[] = [],
): GuardDecision {
  const text = message.trim();
  if (JAILBREAK.test(text)) return "refuse";
  if (!text && hasImage) return "allow";
  if (META.test(text) && !isHardOffTopic(text)) return "meta";
  if (isHardOffTopic(text) && !isBankingText(text)) return "refuse";
  if (isBankingText(text) || hasImage) return "allow";
  if (hasBankingThread(prior)) return "allow";
  return "refuse";
}

export function refusalText(message = ""): string {
  const kind = offTopicKind(message);
  switch (kind) {
    case "retail":
      return `Maaf ya, saya Customer Service ${BANK_NAME}, bukan kasir. Saya tidak bisa cek harga barang belanja. Kalau ada pertanyaan rekening, kartu, transfer, atau pinjaman, silakan.`;
    case "vendor":
      return `Maaf ya, saya Customer Service ${BANK_NAME}, bukan pedagang. Saya tidak berjualan siomay atau barang lain — saya hanya membantu layanan perbankan.`;
    case "food":
      return `Maaf ya, saya Customer Service ${BANK_NAME}, bukan koki. Urusan resep atau makanan di luar tugas saya. Saya siap bantu layanan bank.`;
    case "personal":
      return `Maaf ya, saya asisten Customer Service virtual ${BANK_NAME}, bukan manusia dengan rumah atau alamat pribadi. Saya tidak “tinggal” di suatu tempat — saya siaga di chat ini untuk rekening, kartu, pinjaman, dan layanan bank.`;
    case "code":
      return `Maaf ya, saya Customer Service ${BANK_NAME}, bukan programmer. Saya hanya membantu rekening, transaksi, dan layanan bank.`;
    case "entertainment":
      return `Maaf ya, saya Customer Service ${BANK_NAME}. Hiburan di luar layanan bank bukan ranah saya. Silakan tanyakan saldo, mutasi, kartu, atau pinjaman.`;
    case "jailbreak":
      return `Maaf, saya tetap Customer Service ${BANK_NAME}. Saya hanya menjawab pertanyaan perbankan.`;
    default:
      return `Maaf ya, itu di luar tugas saya sebagai Customer Service ${BANK_NAME}. Saya hanya bisa membantu rekening, transaksi, kartu, pinjaman, investasi, dan prosedur perbankan.`;
  }
}
