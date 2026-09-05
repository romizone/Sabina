import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { CustomerProfile } from "./types";

export type TicketCategory =
  | "atm_swallowed"
  | "atm_no_dispense"
  | "fraud"
  | "card_lost"
  | "unauthorized_tx"
  | "transfer_failed"
  | "app_issue"
  | "other";

export type TicketPriority = "critical" | "high" | "medium";
export type TicketStatus = "open" | "in_progress" | "resolved";

export interface ServiceTicket {
  id: string;
  cif: string;
  customerName: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  title: string;
  summary: string;
  unit: string;
  sla: string;
  actions: string[];
  channel: "Live CS Sabina";
  createdAt: string;
  relatedAccount?: string;
}

const DATA_DIR = process.env.VERCEL ? "/tmp" : join(process.cwd(), ".data");
const FILE = join(DATA_DIR, "tickets.json");

type IncidentRule = {
  category: TicketCategory;
  priority: TicketPriority;
  title: string;
  unit: string;
  sla: string;
  actions: string[];
  pattern: RegExp;
};

const INCIDENTS: IncidentRule[] = [
  {
    category: "atm_swallowed",
    priority: "high",
    title: "Kartu ATM tertelan",
    unit: "Channel ATM",
    sla: "blokir kartu langsung, pengambilan 2 hari kerja",
    actions: [
      "Blokir kartu debit (hot-card)",
      "Catat ID ATM, waktu, dan lokasi bila diketahui",
      "Tawarkan ambil kartu di cabang pengelola atau terbit kartu baru",
    ],
    pattern:
      /kartu .*(ketelen|ke telen|tertelan|terhisap|termakan)|atm .*(telan|makan|hisap).*kartu|(ketelen|tertelan).*(atm|kartu)/i,
  },
  {
    category: "atm_no_dispense",
    priority: "high",
    title: "Uang tidak keluar di ATM",
    unit: "Channel ATM",
    sla: "refund otomatis 1x24 jam, investigasi manual 7 hari kerja",
    actions: [
      "Cek journal ATM vs core",
      "Buka recon ATM",
      "Refund bila gagal dispense",
    ],
    pattern:
      /uang (tidak|gak|nggak|ga) keluar|atm (error|gagal).*(tarik|keluar)|double debet|tarik tunai (gagal|tidak)/i,
  },
  {
    category: "fraud",
    priority: "critical",
    title: "Laporan fraud / penipuan",
    unit: "Fraud Operations",
    sla: "blokir kanal langsung, investigasi 1-7 hari kerja",
    actions: [
      "Blokir aplikasi, kartu, dan token",
      "Paksa ganti PIN (nasabah di kanal resmi)",
      "Buka kasus fraud dan catat kronologi",
      "Ingatkan CS tidak pernah minta OTP/PIN",
    ],
    pattern:
      /\b(fraud|penipuan|phishing|scam|otp (bocor|dibocorkan|diminta orang)|link palsu|rekening dikuras|diretas|hacked)\b/i,
  },
  {
    category: "unauthorized_tx",
    priority: "critical",
    title: "Transaksi tidak dikenali",
    unit: "Dispute & Fraud",
    sla: "chargeback 45-90 hari, temporary credit bila fraud kuat",
    actions: [
      "Kunci transaksi tersangka",
      "Blokir kartu bila indikasi fraud",
      "Ajukan dispute/chargeback",
    ],
    pattern:
      /transaksi (yang )?(tidak|gak|nggak) (saya )?(kenal|dikenali|akui)|belanja (tidak|gak) saya|ada tagihan aneh|transaksi misterius/i,
  },
  {
    category: "card_lost",
    priority: "high",
    title: "Kartu hilang atau dicuri",
    unit: "Card Operations",
    sla: "blokir < 3 menit, kartu pengganti 3-7 hari kerja",
    actions: [
      "Blokir kartu permanen",
      "Tinjau transaksi 24 jam terakhir",
      "Terbitkan kartu pengganti",
    ],
    pattern:
      /kartu (saya |aku )?(hilang|dicuri|ilang|keambil)|kehilangan kartu|kartu (debit|kredit|atm) (saya )?(hilang|dicuri)/i,
  },
  {
    category: "transfer_failed",
    priority: "medium",
    title: "Transfer gagal atau pending",
    unit: "Payment Operations",
    sla: "refund otomatis 1x24 jam, investigasi 3 hari kerja",
    actions: [
      "Cek reference, jam, nominal, rekening tujuan",
      "Cek status core dan switch",
      "Refund bila debet sudah terjadi dan tujuan gagal",
    ],
    pattern:
      /transfer (saya )?(gagal|pending|tidak masuk|belum masuk)|uang (belum|tidak) masuk|kiriman (gagal|nyangkut)/i,
  },
  {
    category: "app_issue",
    priority: "medium",
    title: "Gangguan aplikasi Bang Digital",
    unit: "Digital Channel",
    sla: "15 menit untuk kasus individu",
    actions: ["Cek insiden massal", "Reset sesi perangkat", "Minta versi aplikasi"],
    pattern:
      /aplikasi (error|tidak bisa|gak bisa|force close|maintenance)|tidak bisa login|gagal masuk aplikasi/i,
  },
];

let cache: ServiceTicket[] | null = null;
let seq = 0;

function load(): ServiceTicket[] {
  if (cache) return cache;
  try {
    const raw = readFileSync(FILE, "utf8");
    cache = JSON.parse(raw) as ServiceTicket[];
    seq = cache.reduce((m, t) => {
      const n = Number(t.id.split("-").pop());
      return Number.isFinite(n) ? Math.max(m, n) : m;
    }, 0);
  } catch {
    cache = [];
    seq = 0;
  }
  return cache;
}

function persist(list: ServiceTicket[]) {
  cache = list;
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(list, null, 2), "utf8");
}

function nextId(at = new Date()): string {
  seq += 1;
  const y = String(at.getFullYear()).slice(2);
  const m = String(at.getMonth() + 1).padStart(2, "0");
  const d = String(at.getDate()).padStart(2, "0");
  return `BDCS-${y}${m}${d}-${String(seq).padStart(5, "0")}`;
}

const HOW_TO = /bagaimana cara|prosedur|apa (itu|maksud)|info(rmasi)? (tentang|soal)|cara (blokir|lapor)/i;
const EXPLICIT = /buat(kan)? tiket|buka tiket|tolong (dibikinkan|dibuatkan) (tiket|pengaduan)|saya (mau|ingin) (lapor|ngadu|mengadu)/i;

export function classifyIncident(message: string): IncidentRule | null {
  const text = message.trim();
  if (!text) return null;
  if (/cek tiket|status tiket|nomor tiket|tiket saya/i.test(text) && !EXPLICIT.test(text)) {
    return null;
  }
  if (HOW_TO.test(text) && !EXPLICIT.test(text) && !/\b(saya|aku)\b/i.test(text)) {
    return null;
  }
  for (const rule of INCIDENTS) {
    if (rule.pattern.test(text)) return rule;
  }
  if (EXPLICIT.test(text) || /\b(ngadu|mengadu|pengaduan|komplain|lapor(kan)?)\b/i.test(text)) {
    return {
      category: "other",
      priority: "medium",
      title: "Pengaduan layanan",
      unit: "Customer Care",
      sla: "ack 2 hari kerja, selesai 20 hari kerja",
      actions: ["Buat tiket pengaduan", "Klasifikasi unit terkait"],
      pattern: /.*/,
    };
  }
  return null;
}

export function createTicket(params: {
  profile?: CustomerProfile;
  cif?: string;
  message: string;
  hasImage?: boolean;
}): ServiceTicket | null {
  const rule = classifyIncident(params.message);
  if (!rule) return null;

  const cif = params.profile?.cif.cif ?? params.cif ?? "UNKNOWN";
  const name = params.profile?.cif.name ?? "Nasabah";
  const list = load();
  const recent = list.find(
    (t) =>
      t.cif === cif &&
      t.category === rule.category &&
      t.status !== "resolved" &&
      Date.now() - new Date(t.createdAt).getTime() < 15 * 60 * 1000,
  );
  if (recent) return recent;

  const card = params.profile?.cards[0];
  const account = params.profile?.savings[0]?.accountNo;
  const ticket: ServiceTicket = {
    id: nextId(),
    cif,
    customerName: name,
    category: rule.category,
    priority: rule.priority,
    status: "open",
    title: rule.title,
    summary: params.message.trim().slice(0, 400),
    unit: rule.unit,
    sla: rule.sla,
    actions: [
      ...rule.actions,
      ...(params.hasImage ? ["Lampiran gambar diterima untuk investigasi"] : []),
    ],
    channel: "Live CS Sabina",
    createdAt: new Date().toISOString(),
    relatedAccount: card ? `CC${card.last4}` : account,
  };
  persist([ticket, ...list]);
  return ticket;
}

export function listTickets(cif?: string): ServiceTicket[] {
  const list = load();
  if (!cif) return list;
  return list.filter((t) => t.cif === cif);
}

export function findTicket(id: string): ServiceTicket | undefined {
  return load().find((t) => t.id.toLowerCase() === id.trim().toLowerCase());
}

export function formatTicket(ticket: ServiceTicket): string {
  return [
    `Nomor tiket: ${ticket.id}`,
    `Judul: ${ticket.title}`,
    `Nasabah: ${ticket.customerName} (CIF ${ticket.cif})`,
    `Kategori: ${ticket.category} | Prioritas: ${ticket.priority} | Status: ${ticket.status}`,
    `Unit: ${ticket.unit} | SLA: ${ticket.sla}`,
    `Dibuat: ${ticket.createdAt}`,
    `Kronologi: ${ticket.summary}`,
    `Tindakan sistem: ${ticket.actions.join("; ")}`,
    ticket.relatedAccount ? `Rekening/kartu terkait: ${ticket.relatedAccount}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function ticketLookupId(message: string): string | undefined {
  const hit = message.match(/BDCS-\d{6}-\d{5}/i);
  return hit?.[0];
}
