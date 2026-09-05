import { BANK_NAME } from "./config";
import type { GuardDecision } from "./types";

export type OffTopicKind =
  | "retail"
  | "food"
  | "code"
  | "entertainment"
  | "jailbreak"
  | "general";

const META =
  /\b(halo|hai|hi|hello|selamat (pagi|siang|sore|malam)|terima kasih|makasih|thanks|siapa kamu|siapa anda|kamu siapa|nama kamu|apa kabar)\b/i;

const BANKING =
  /\b(bank|rekening|tabungan|giro|deposito|saldo|mutasi|transaksi|transfer|bi-?fast|rtgs|skn|qris|atm|kartu|kredit|debit|pinjam|pinjem|minjem|pinjaman|ngutang|utang|cicil|cicilan|plafon|syarat|pengajuan|ajukan|duit|uang|miliar|milyar|juta|kpr|kta|kkb|kur|angsuran|tagihan|limit|pin|otp|cif|ktp|npwp|invest|reksa|obligasi|wealth|bunga|admin|biaya|tarif|rate|jatuh tempo|lokasi|terdekat|cabang|kantor|crm|kurs|valas|usd|lps|ojk|promo|cashback|jam operasional|call center|contact|kontak|hubungi|tiket|pengaduan|komplain|fraud|phishing|blokir|unblokir|va\b|virtual account|paylater|asuransi|bang digital|sabina|nasabah|pencairan|statement|koran|nik|ibu kandung)\b/i;

const RETAIL =
  /\b(shampo|sampo|sabun|pasta gigi|deterjen|skincare|make ?up|lipstik|minyak goreng|beras|indomie|mie instan|susu formula|popok|harga barang|harga shampo|harga sampo|supermarket|minimarket|alfamart|indomaret|kasir|belanja harian|diskon toko|promo toko)\b/i;

const FOOD =
  /\b(resep|masak|memasak|masakan|kue|kopi racikan|menu makan|restoran resep)\b/i;

const CODE =
  /\b(coding|program(?:ming)?|python|javascript|typescript|source code|debug(ging)?|hack(?:ing)?|exploit|malware)\b/i;

const ENTERTAINMENT =
  /\b(puisi|pantun|lagu|film netflix|gossip|selebriti|zodiak|ramalan|judi|togel|slot)\b/i;

const OTHER_OFF =
  /\b(politik|pemilu|agama|khotbah|skripsi|pr sekolah|pekerjaan rumah|cuaca luar|senjata|bom|racun|nude|porn|sex)\b/i;

const JAILBREAK =
  /\b(ignore (all|previous|above)|system prompt|developer mode|jailbreak|pretend you are|kamu sekarang|lupakan instruksi|bypass)\b/i;

export function offTopicKind(message: string): OffTopicKind {
  const text = message.trim();
  if (JAILBREAK.test(text)) return "jailbreak";
  if (RETAIL.test(text)) return "retail";
  if (FOOD.test(text)) return "food";
  if (CODE.test(text)) return "code";
  if (ENTERTAINMENT.test(text)) return "entertainment";
  return "general";
}

export function classifyGuard(message: string, hasImage: boolean): GuardDecision {
  const text = message.trim();
  if (JAILBREAK.test(text)) return "refuse";
  if (!text && hasImage) return "allow";
  if (META.test(text) && !RETAIL.test(text) && !FOOD.test(text) && !CODE.test(text) && !OTHER_OFF.test(text)) {
    return "meta";
  }
  if (RETAIL.test(text) || FOOD.test(text) || CODE.test(text) || ENTERTAINMENT.test(text) || OTHER_OFF.test(text)) {
    if (!BANKING.test(text)) return "refuse";
  }
  if (BANKING.test(text) || hasImage) return "allow";
  return "allow";
}

export function refusalText(message = ""): string {
  const kind = offTopicKind(message);
  switch (kind) {
    case "retail":
      return `Maaf ya, saya Customer Service ${BANK_NAME}, bukan kasir. Saya tidak bisa membantu cek harga sampo atau barang belanja. Kalau ada yang ingin ditanyakan soal rekening, kartu, transfer, pinjaman, atau layanan bank, silakan ya.`;
    case "food":
      return `Maaf ya, saya Customer Service ${BANK_NAME}, bukan koki. Saya tidak bisa membantu resep atau urusan dapur. Saya siap membantu layanan perbankan Anda.`;
    case "code":
      return `Maaf ya, saya Customer Service ${BANK_NAME}, bukan programmer. Saya hanya membantu hal terkait rekening, transaksi, dan layanan bank.`;
    case "entertainment":
      return `Maaf ya, saya Customer Service ${BANK_NAME}. Hiburan di luar layanan bank bukan ranah saya. Silakan tanyakan saldo, mutasi, kartu, atau pinjaman ya.`;
    case "jailbreak":
      return `Maaf, saya tetap Customer Service ${BANK_NAME}. Saya hanya menjawab pertanyaan perbankan.`;
    default:
      return `Maaf ya, itu di luar tugas saya. Saya Customer Service ${BANK_NAME}, bukan kasir atau layanan di luar bank. Saya hanya bisa membantu rekening, transaksi, kartu, pinjaman, investasi, dan prosedur perbankan.`;
  }
}
