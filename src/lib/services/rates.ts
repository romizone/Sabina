import { formatIdDate, now } from "../dates";
import { formatIdr } from "../money";

export function rateBoard(clock = now()) {
  return {
    effective: formatIdDate(clock),
    deposits: [
      { tenor: "1 bulan", rate: "3,50% p.a.", min: formatIdr(10_000_000) },
      { tenor: "3 bulan", rate: "4,25% p.a.", min: formatIdr(10_000_000) },
      { tenor: "6 bulan", rate: "4,75% p.a.", min: formatIdr(10_000_000) },
      { tenor: "12 bulan", rate: "5,10% p.a.", min: formatIdr(10_000_000) },
    ],
    savings: [
      { product: "BangTabungan Digital", rate: "2,00–2,80% p.a.", note: "bunga harian, kredit awal bulan" },
      { product: "BangTabungan Rencana", rate: "3,50% p.a.", note: "autodebet bulanan" },
      { product: "BangGiro Usaha", rate: "1,00% p.a.", note: "saldo mengendap" },
    ],
    loans: [
      { product: "BangPinjam KTA", rate: "14,90% p.a.", tenor: "12–36 bulan" },
      { product: "BangPinjam Usaha", rate: "12,90% p.a.", tenor: "12–36 bulan" },
      { product: "BangKPR", rate: "8,25–8,50% p.a.", tenor: "hingga 20 tahun" },
      { product: "BangKKB", rate: "7,90% p.a.", tenor: "12–60 bulan" },
      { product: "BangKUR", rate: "6,00% p.a.", tenor: "12–60 bulan" },
      { product: "BangPaylater", rate: "1,50% / bulan", tenor: "1–12 bulan" },
    ],
    fx: [
      { pair: "USD/IDR", buy: 16250, sell: 16410 },
      { pair: "SGD/IDR", buy: 12680, sell: 12840 },
      { pair: "EUR/IDR", buy: 17620, sell: 17890 },
      { pair: "JPY/IDR", buy: 108.4, sell: 111.2 },
    ],
    fees: [
      { name: "BI-FAST", amount: "Rp 2.500 / transaksi di bawah Rp 250 juta" },
      { name: "RTGS", amount: "Rp 25.000, cut-off 14.30 WIB" },
      { name: "SKN", amount: "Rp 2.900, beberapa batch hari kerja" },
      { name: "Admin tabungan", amount: "Rp 11.000 / 3 bulan (bebas bila saldo rata-rata terpenuhi)" },
      { name: "Admin giro", amount: "Rp 25.000 / 3 bulan" },
      { name: "Tarik ATM bank lain", amount: "Rp 7.500" },
    ],
    limits: [
      { segment: "personal", qris: "Rp 10 juta/hari", bifast: "Rp 25 juta/hari", atm: "Rp 10 juta/hari" },
      { segment: "affluent", qris: "Rp 25 juta/hari", bifast: "Rp 50 juta/hari", atm: "Rp 15 juta/hari" },
      { segment: "priority", qris: "Rp 50 juta/hari", bifast: "Rp 100 juta/hari", atm: "Rp 20 juta/hari" },
      { segment: "sme", qris: "Rp 25 juta/hari", bifast: "Rp 250 juta/hari", atm: "Rp 15 juta/hari" },
    ],
    lps: "Simpanan dijamin LPS hingga Rp 2 miliar per nasabah per bank, selama bunga tidak melebihi tingkat penjaminan. Reksa dana dan bancassurance tidak dijamin LPS.",
    hours: "Cabang Senin–Jumat 08.00–15.00 WIB. ATM 24 jam. CRM 05.00–22.00. Digital banking 24/7 kecuali maintenance.",
    contact: "Live CS Sabina di sabina.rominur.com · Call center fiksi 1500-BANG",
    promo: [
      "BI-FAST gratis hingga 10 transaksi/bulan untuk BangTabungan Digital",
      "Cashback 5% merchant makanan dengan BangKartu Gold/Platinum (MCC F&B, max Rp 50.000)",
      "Bunga deposito 12 bulan +0,10% untuk dana baru bulan berjalan",
    ],
  };
}

export function formatRateBoard(clock = now()): string {
  const b = rateBoard(clock);
  return [
    `Papan rate Bang Digital berlaku ${b.effective}`,
    "Deposito:",
    ...b.deposits.map((d) => `- ${d.tenor}: ${d.rate}, min ${d.min}`),
    "Simpanan:",
    ...b.savings.map((s) => `- ${s.product}: ${s.rate} (${s.note})`),
    "Pinjaman (board):",
    ...b.loans.map((l) => `- ${l.product}: ${l.rate}, tenor ${l.tenor}`),
    "Kurs counter digital:",
    ...b.fx.map((f) => `- ${f.pair} beli ${f.buy} / jual ${f.sell}`),
    "Biaya:",
    ...b.fees.map((f) => `- ${f.name}: ${f.amount}`),
    "Limit harian:",
    ...b.limits.map((l) => `- ${l.segment}: QRIS ${l.qris}, BI-FAST ${l.bifast}, ATM ${l.atm}`),
    `LPS: ${b.lps}`,
    `Jam: ${b.hours}`,
    `Kontak: ${b.contact}`,
    "Promo berjalan:",
    ...b.promo.map((p) => `- ${p}`),
  ].join("\n");
}
