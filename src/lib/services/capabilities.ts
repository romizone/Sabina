import { describeDeposit } from "../data/deposit";
import { formatIdr } from "../money";
import type { CustomerProfile } from "../types";
import { formatOutlet, outletsByCity, searchOutlets, type OutletKind } from "./locations";
import { formatRateBoard, rateBoard } from "./rates";

export type CsIntent =
  | "atm_location"
  | "branch_location"
  | "deposit_rate"
  | "deposit_maturity"
  | "fx_rate"
  | "fees"
  | "limits"
  | "hours"
  | "lps"
  | "promo"
  | "product"
  | "contact"
  | "loan_apply"
  | "card_apply";

const CITY_HINTS = [
  "cibubur",
  "jakarta selatan",
  "jakarta pusat",
  "jakarta barat",
  "jakarta utara",
  "jakarta timur",
  "tangerang selatan",
  "bandar lampung",
  "jakarta",
  "bandung",
  "bekasi",
  "bogor",
  "depok",
  "tangerang",
  "surabaya",
  "sidoarjo",
  "malang",
  "semarang",
  "yogyakarta",
  "jogja",
  "sleman",
  "solo",
  "medan",
  "palembang",
  "pekanbaru",
  "padang",
  "lampung",
  "makassar",
  "manado",
  "denpasar",
  "bali",
  "kuta",
  "badung",
  "balikpapan",
  "samarinda",
  "pontianak",
  "banjarmasin",
  "batam",
  "ambon",
  "kupang",
  "mataram",
  "jayapura",
  "aceh",
  "jambi",
];

function cityFrom(message: string, fallback?: string): string {
  const q = message.toLowerCase();
  if (q.includes("jogja")) return "Yogyakarta";
  if (q.includes("bali") || q.includes("kuta")) return "Badung";
  if (q.includes("lampung")) return "Bandar Lampung";
  const hit = CITY_HINTS.find((c) => q.includes(c));
  if (hit) {
    return hit
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  return fallback ?? "Jakarta Selatan";
}

export function detectServiceIntents(message: string): CsIntent[] {
  const q = message.toLowerCase();
  const found: CsIntent[] = [];
  if (/\batm\b|crm|setor tunai mesin/.test(q) && /lokasi|terdekat|dimana|di mana|cari|dekat/.test(q)) {
    found.push("atm_location");
  } else if (/\batm\b/i.test(q) && /lokasi|terdekat|dimana|di mana|cari/.test(q)) {
    found.push("atm_location");
  }
  if (
    /(lokasi|cari|dimana|di mana|terdekat).*(cabang|kantor|bank|kcp|kc\b)/.test(q) ||
    /(cabang|kantor bank|unit kerja).*(terdekat|dimana|di mana|lokasi)/.test(q) ||
    /cari bank|cari cabang/.test(q) ||
    /janji\s*temu|appointment|jadwalkan|reservasi|kunjungan prioritas/.test(q)
  ) {
    found.push("branch_location");
  }
  if (/bunga deposito|rate deposito|suku bunga deposito|deposito (berapa|saat ini)/.test(q)) {
    found.push("deposit_rate");
  }
  if (/jatuh tempo|jt tempo|tempo deposito|deposito saya (kapan|habis)|aro deposito/.test(q)) {
    found.push("deposit_maturity");
  }
  if (/\bkurs\b|valas|usd|tukar dollar|nilai tukar/.test(q)) found.push("fx_rate");
  if (/biaya (transfer|admin|rtgs|skn|bi-?fast)|tarif/.test(q)) found.push("fees");
  if (/limit (harian|qris|transfer|atm)|naikkan limit/.test(q)) found.push("limits");
  if (/jam (operasional|buka|kerja)|cabang buka/.test(q)) found.push("hours");
  if (/\blps\b|penjaminan|dijamin/.test(q)) found.push("lps");
  if (/promo|cashback|diskon merchant/.test(q)) found.push("promo");
  if (
    /call center|hubungi|nomor cs|kontak|contact|dihubungi|hubung(i)? siapa|cs siapa|ke siapa/.test(
      q,
    )
  ) {
    found.push("contact");
  }
  if (/produk (tabungan|deposito|kpr|kur|kartu)|apa itu (deposito|kpr|kur|giro)/.test(q)) {
    found.push("product");
  }
  const wantsCard =
    /kartu kredit|buka kartu|ajukan kartu|apply (cc|kartu)|bang kartu|limit kartu/.test(q) &&
    !/ketelen|tertelan|hilang|dicuri|blokir|tagihan|jatuh tempo/.test(q);
  const wantsLoan =
    /pinj(am|em)|minjem|pinjaman|kpr\b|kta\b|kkb\b|\bkur\b|plafon|kredit (rumah|kendaraan|usaha|tanpa agunan|modal)|pinjem duit|pinjam uang/.test(
      q,
    );
  if (wantsCard) found.push("card_apply");
  if (wantsLoan && !wantsCard) found.push("loan_apply");
  if (!found.length && /lokasi atm|atm terdekat/.test(q)) found.push("atm_location");
  return found;
}

function parseAmount(message: string): number | null {
  const q = message.toLowerCase().replace(/\./g, "").replace(/,/g, ".");
  const milyar = q.match(/(\d+(?:\.\d+)?)\s*(miliar|milyar|m\b)/);
  if (milyar) return Math.round(Number(milyar[1]) * 1_000_000_000);
  const juta = q.match(/(\d+(?:\.\d+)?)\s*juta/);
  if (juta) return Math.round(Number(juta[1]) * 1_000_000);
  return null;
}

function cardRequirements(profile?: CustomerProfile): string {
  const name = profile?.cif.name ?? "nasabah";
  const city = profile?.cif.city ?? "kota nasabah";
  const existing = profile?.cards ?? [];
  return [
    "=== PENGAJUAN BANGKARTU KREDIT ===",
    `Nasabah: ${name} | Kota: ${city}`,
    existing.length
      ? `Kartu existing: ${existing
          .map((c) => `${c.product} ****${c.last4}, limit ${formatIdr(c.limit)}, status ${c.status}`)
          .join("; ")}. Bisa ajukan kartu tambahan atau naik limit, bukan harus kartu pertama.`
      : "Belum ada kartu kredit aktif.",
    "Kontak / channel pengajuan (jawab ini jika nasabah tanya contact siapa):",
    "- Live CS Sabina di chat ini — saya bantu syarat, cek data, dan arahkan pengajuan",
    "- Aplikasi Bang Digital → Kartu → Ajukan BangKartu",
    "- Call center fiksi 1500-BANG, tekan 2 untuk kartu kredit",
    `- Cabang Bang Digital ${city} (bawa KTP, NPWP, slip gaji / rekening koran 3 bulan)`,
    "Syarat umum:",
    "- WNI, usia 21–60 tahun, KYC verified",
    "- KTP, NPWP, slip gaji 3 bulan atau mutasi rekening",
    "- Penghasilan orientasi Classic dari ±Rp 5 juta/bulan; Gold/Platinum sesuai segmen",
    "- SLIK lancar, tidak masuk daftar hitam",
    "- Keputusan 1–3 hari kerja; kartu virtual dulu, fisik menyusul",
    "Jangan minta CVV/PIN. Jangan janjikan disetujui.",
  ].join("\n");
}

function loanRequirements(message: string, profile?: CustomerProfile): string {
  const amount = parseAmount(message);
  const label = amount ? `Rp ${amount.toLocaleString("id-ID")}` : "nominal yang disebut nasabah";
  const name = profile?.cif.name ?? "nasabah";
  const segment = profile?.cif.segment ?? "personal";
  const kyc = profile?.cif.kycStatus ?? "verified";
  return [
    `=== SYARAT PENGAJUAN PINJAMAN ${label.toUpperCase()} ===`,
    `Nasabah: ${name} | Segmen: ${segment} | KYC: ${kyc}`,
    amount && amount >= 1_000_000_000
      ? "Plafon 1 miliar ke atas biasanya lewat BangKPR (agunan rumah) atau BangKUR/Usaha (UMKM + agunan/usaha produktif). BangPinjam KTA tanpa agunan umumnya di bawah Rp 300 juta."
      : "Cocokkan produk: KTA tanpa agunan (plafon terbatas), KUR UMKM, KKB kendaraan, atau KPR rumah.",
    "Syarat umum:",
    "- WNI, usia 21–55 (KTA/KUR) atau hingga 65 saat lunas (KPR)",
    "- KTP, NPWP, slip gaji / rekening koran 3 bulan, atau omzet usaha untuk KUR/SME",
    "- SLIK lancar (kolektibilitas 1). Nasabah menunggak harus dilunasi dulu.",
    "- Penghasilan / DBR cukup: angsuran semua fasilitas biasanya max ±35–40% penghasilan",
    "- Untuk ±1 miliar: agunan SHM/HGB (KPR) atau usaha + jaminan (KUR/Usaha); appraisal wajib",
    "- Asuransi jiwa kredit (KPR/KUR) dan asuransi kebakaran bila ada agunan rumah",
    "Dokumen tambahan KPR: SHM/HGB, PBB, SPR developer bila indent.",
    "Dokumen tambahan KUR: NIB/SKU, mutasi usaha, foto tempat usaha.",
    "Alur: simulasi → pengajuan di aplikasi/cabang → SLIK & scoring → putusan 2–21 hari kerja (KTA cepat, KPR lebih lama) → akad → pencairan.",
    "CS tidak menjanjikan disetujui. Tawarkan simulasi dan arahkan ke pengajuan resmi.",
  ].join("\n");
}

function listOutlets(city: string, kind?: OutletKind): string {
  const rows = (kind ? outletsByCity(city, kind) : outletsByCity(city)).slice(0, 6);
  const extra = rows.length ? rows : searchOutlets(city, kind).slice(0, 6);
  if (!extra.length) return `Tidak ada titik layanan untuk ${city}.`;
  return extra.map((o) => `- ${formatOutlet(o)}`).join("\n");
}

export function formatLocationReply(message: string, profile?: CustomerProfile): string | null {
  const intents = detectServiceIntents(message);
  const wantsBranch = intents.includes("branch_location");
  const wantsAtm = intents.includes("atm_location");
  if (!wantsBranch && !wantsAtm) return null;
  const city = cityFrom(message, profile?.cif.city);
  const who = profile?.cif.name.split(" ")[0] ?? "Nasabah";
  const parts: string[] = [`Baik ${who}, berikut titik layanan Bang Digital di ${city}.`];
  if (wantsBranch) {
    parts.push("", `Kantor cabang (${city}):`, listOutlets(city, "kc"), listOutlets(city, "kcp"));
  }
  if (wantsAtm) {
    parts.push("", `ATM / CRM (${city}):`, listOutlets(city, "atm"), listOutlets(city, "crm"));
  }
  parts.push(
    "",
    "Jam KC/KCP: Senin–Jumat 08.00–15.00 WIB. Nasabah prioritas bisa saya jadwalkan ke lounge tanpa antri teller reguler — cukup bilang ok jadwalkan atau sebut hari/jam.",
  );
  return parts.join("\n");
}

export function buildServiceContext(message: string, profile?: CustomerProfile): string {
  const intents = detectServiceIntents(message);
  if (!intents.length) return "";
  const city = cityFrom(message, profile?.cif.city);
  const board = rateBoard();
  const parts: string[] = [`Intent CS terdeteksi: ${intents.join(", ")}`, `Kota acuan: ${city}`];

  for (const intent of intents) {
    if (intent === "atm_location") {
      parts.push(`=== LOKASI ATM / CRM ${city.toUpperCase()} ===`, listOutlets(city, "atm"), listOutlets(city, "crm"));
    }
    if (intent === "branch_location") {
      parts.push(`=== LOKASI KANTOR ${city.toUpperCase()} ===`, listOutlets(city, "kc"), listOutlets(city, "kcp"));
    }
    if (intent === "deposit_rate" || intent === "product" || intent === "fees" || intent === "limits") {
      parts.push("=== PAPAN RATE / BIAYA / LIMIT ===", formatRateBoard());
    }
    if (intent === "fx_rate") {
      parts.push(
        `=== KURS ${board.effective} ===`,
        ...board.fx.map((f) => `- ${f.pair} beli ${f.buy} / jual ${f.sell}`),
      );
    }
    if (intent === "deposit_maturity") {
      const deposits = profile?.savings.filter((s) => s.type === "deposit") ?? [];
      parts.push(
        "=== JATUH TEMPO DEPOSITO NASABAH ===",
        deposits.length
          ? deposits.map((d) => `- ${describeDeposit(d)}`).join("\n")
          : "Nasabah ini tidak memiliki BangDeposito aktif.",
      );
    }
    if (intent === "hours") parts.push(`Jam layanan: ${board.hours}`);
    if (intent === "lps") parts.push(`LPS: ${board.lps}`);
    if (intent === "promo") parts.push("Promo:", ...board.promo.map((p) => `- ${p}`));
    if (intent === "contact") {
      parts.push(
        "=== KONTAK BANG DIGITAL ===",
        board.contact,
        "Live CS Sabina (chat ini) untuk rekening, kartu, pinjaman, dan pengajuan.",
        "Call center fiksi 1500-BANG · Cabang sesuai kota acuan di atas.",
      );
    }
    if (intent === "card_apply") {
      parts.push(cardRequirements(profile));
    }
    if (intent === "loan_apply") {
      parts.push(loanRequirements(message, profile));
    }
  }

  return parts.join("\n");
}
