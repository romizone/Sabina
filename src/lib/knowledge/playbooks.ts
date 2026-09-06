export type Playbook = {
  id: string;
  title: string;
  keywords: string[];
  briefing: string;
};

export const PLAYBOOKS: Playbook[] = [
  {
    id: "PB-APP-LOGIN",
    title: "Aplikasi Bang Digital: login, PIN, biometrik",
    keywords: [
      "aplikasi",
      "login",
      "masuk",
      "pin",
      "password",
      "biometrik",
      "sidik",
      "wajah",
      "lupa pin",
      "ganti pin",
      "force close",
      "error aplikasi",
      "maintenance",
    ],
    briefing: `Aplikasi resmi hanya dari App Store / Play Store "Bang Digital". Jangan minta PIN/OTP.
Lupa PIN: otentikasi CIF + DOB + ibu kandung + OTP ke HP terdaftar → tautan reset (SLA 15 menit). 3x salah PIN = blokir; unblokir via Live CS / video banking.
Perangkat di-root/jailbreak ditolak. Force close: update aplikasi, logout semua device, clear cache. Insiden massal: sampaikan ETA, jangan reset data.
Notifikasi: menu Pengaturan → Alert saldo / keamanan / promo. SMS berbayar sesuai paket operator.`,
  },
  {
    id: "PB-DEVICE",
    title: "Device binding, ganti HP, HP hilang",
    keywords: [
      "device",
      "perangkat",
      "ganti hp",
      "hp hilang",
      "hape",
      "logout",
      "binding",
      "sim swap",
      "nomor baru",
    ],
    briefing: `Login di HP baru wajib OTP + pertanyaan keamanan, lalu ikat perangkat. Perangkat lama bisa dipaksa logout.
HP hilang: (1) blokir aplikasi dari chat ini / 1500-BANG, (2) ganti nomor HP di cabang atau video KYC jika SIM ikut hilang, (3) binding ulang.
SIM swap / nomor diretas: blokir kanal, ganti PIN, tinjau transaksi 24 jam, tiket fraud.
Cooling-off 24 jam untuk kenaikan limit dan tambah rekening tujuan baru di perangkat baru.`,
  },
  {
    id: "PB-TRANSFER",
    title: "Transfer BI-FAST, in-bank, RTGS, SKN",
    keywords: [
      "transfer",
      "tf",
      "kirim",
      "bi-fast",
      "bifast",
      "rtgs",
      "skn",
      "kliring",
      "pending",
      "belum masuk",
      "rekening tujuan",
      "antrian",
    ],
    briefing: `In-bank Bang Digital: gratis, realtime. BI-FAST: 24/7, Rp 2.500 di bawah Rp 250 juta (promo: 10x gratis/bulan BangTabungan Digital).
RTGS: same-day sebelum 14.30 WIB, Rp 25.000. SKN: Rp 2.900, batch hari kerja.
Rekening tujuan baru: cooling-off + konfirmasi nama. Nama tidak match: tampilkan risiko, jangan dipaksa CS.
Pending > 15 menit: cek mutasi gagal di core dulu (nasabah sesi sudah terotentikasi). Sampaikan 5 transaksi gagal dalam 24 jam terakhir. RRN/jam/nominal opsional. Refund otomatis 1x24 jam jika debet sudah dan kredit gagal; investigasi manual 3 hd.
Tambah beneficiary: OTP, berlaku penuh setelah cooling-off 24 jam (limit kecil bisa segera).`,
  },
  {
    id: "PB-SWIFT",
    title: "Transfer SWIFT / remitansi luar negeri",
    keywords: ["swift", "luar negeri", "wire", "remittance", "valas transfer", "dollar kirim"],
    briefing: `SWIFT keluar hanya cabang, cut-off 11.00 WIB. Butuh nama beneficiary, rekening, SWIFT/BIC, alamat bank, tujuan dana, dan underlying bila > USD 25.000 setara.
Charge OUR/SHA/BEN. ETA H+0 s.d. H+2. Negara sanctioned ditolak.
Incoming: minta MT103 / reference pengirim. Hold AML mungkin 1x24 jam untuk nominal besar. Jangan tipping-off.`,
  },
  {
    id: "PB-QRIS",
    title: "QRIS bayar, terima, refund",
    keywords: ["qris", "scan", "qr", "merchant", "salah bayar", "refund qris"],
    briefing: `Bayar QRIS debet rekening utama, PIN, realtime. Limit harian: personal Rp 10 jt, affluent 25 jt, priority 50 jt, sme 25 jt.
QR kadaluarsa / merchant nonaktif tidak bisa dipaksa settle. Refund hanya jika merchant/switch setuju; 1–7 hd. RRN + screenshot opsional, jangan ditanya di awal — cek 3 QRIS gagal terakhir di ledger dulu.
QRIS Cross-border (negara yang didukung) ikut kurs + biaya jaringan. Tip/donasi opsional di merchant yang aktifkan.
BangQRIS Merchant (SME): settlement T+1 ke BangGiro, MDR mengikuti skema nasional.`,
  },
  {
    id: "PB-ATM",
    title: "ATM, CRM, tarik tanpa kartu, kartu tertelan",
    keywords: [
      "atm",
      "crm",
      "tarik",
      "setor",
      "tunai",
      "ketelen",
      "tertelan",
      "uang tidak keluar",
      "tanpa kartu",
      "cardless",
    ],
    briefing: `ATM 24 jam. CRM setor 05.00–22.00, kelipatan Rp 50.000, kredit realtime rekening sendiri.
Limit tarik default Rp 10–20 jt/hari sesuai segmen. Tarik tanpa kartu: QR ATM berlaku 5 menit.
Uang tidak keluar tapi terdebet: recon journal, refund auto 1x24 jam / manual 7 hd. ATM bank lain ikut ATM Bersama/Prima (7–14 hari).
Kartu tertelan: blokir dulu, ambil di cabang pengelola 2 hd + KTP, atau terbit kartu baru. Indikasi skimming wajib nomor baru.`,
  },
  {
    id: "PB-EWALLET",
    title: "Top up e-wallet dan e-money",
    keywords: ["top up", "topup", "gopay", "ovo", "dana", "shopeepay", "linkaja", "emoney", "e-wallet", "dompet"],
    briefing: `Top up GoPay / OVO / DANA / ShopeePay / LinkAja dari rekening Bang Digital, realtime, ikut limit harian transfer.
Gagal di mitra: refund otomatis 1x24 jam. Nomor tujuan harus KYC di sisi e-wallet.
Isi ulang e-money (Flazz analog / uang elektronik) di ATM/CRM/aplikasi sesuai chip yang didukung.
CS tidak bisa memaksa mitra kredit ulang tanpa RRN.`,
  },
  {
    id: "PB-BILL",
    title: "Bayar tagihan PLN, telco, BPJS, pajak, pendidikan",
    keywords: [
      "pln",
      "token",
      "pdam",
      "bpjs",
      "telkom",
      "pulsa",
      "pajak",
      "pbb",
      "ukt",
      "tagihan",
      "biller",
      "samsat",
      "stnk",
    ],
    briefing: `Menu Bayar: PLN pascabayar/token, PDAM, BPJS Kesehatan/TK, telco, PBB, pajak daerah, UKT, Samsat.
Closed-amount harus exact. Token PLN muncul di struk; bila token tidak terbit tapi terdebet, tiket biller 1x24 jam.
Autodebet: daftar/batal H-1 sebelum tanggal tarik. Tarikan hari ini tidak bisa ditarik mundur.
Pajak daerah cut-off mengikuti PEMDA. Bukti bayar ke email terdaftar.`,
  },
  {
    id: "PB-VA",
    title: "Virtual account",
    keywords: ["virtual account", "va", "billing", "kode bayar"],
    briefing: `VA closed-amount harus nominal exact; open-amount bebas dalam rentang. Expired tidak di-settle manual CS — minta VA baru.
Kredit realtime atau T+1 tergantung biller. Cek nomor VA, nama, nominal, status billing.
SME bisa terbit BangVA Merchant untuk invoicing.`,
  },
  {
    id: "PB-CC-APPLY",
    title: "Pengajuan dan aktivasi kartu kredit",
    keywords: [
      "buka kartu",
      "ajukan kartu",
      "kartu kredit",
      "kk",
      "cc",
      "aktivasi kartu",
      "kartu baru",
      "supplementary",
      "tambahan",
    ],
    briefing: `Channel: chat Sabina, aplikasi → Kartu → Ajukan, 1500-BANG tekan 2, atau cabang (KTP+NPWP+slip gaji/koran 3 bulan).
Syarat: WNI 21–60, KYC verified, SLIK lancar, penghasilan Classic ±Rp 5 jt/bln (Gold/Platinum lebih tinggi). Putusan 1–3 hd.
Kartu virtual langsung; fisik 3–7 hd ekspedisi. Aktivasi: aplikasi / ATM / chat setelah otentikasi. Jangan minta CVV.
Nasabah existing bisa kartu tambahan, supplementary (usia ≥17), atau naik limit. Kartu late tidak eligible naik limit.
Tutup kartu: outstanding + cicilan harus nol.`,
  },
  {
    id: "PB-CC-BILL",
    title: "Tagihan, bunga, denda, cicilan kartu",
    keywords: [
      "tagihan kartu",
      "minimum",
      "late",
      "denda kartu",
      "bunga kartu",
      "cicilan",
      "installment",
      "cash advance",
      "iuran tahunan",
      "overlimit",
    ],
    briefing: `Statement: total, minimum (5% atau min Rp 50.000), due date, bunga revolving 2,25%/bulan bila tidak full.
Late charge 2% atau min Rp 50.000 jika minimum belum masuk due date. Iuran tahunan: Classic Rp 150 rb, Gold 300 rb, Platinum 750 rb (tahun pertama sering bebas program).
Cicilan: transaksi ≥ Rp 500.000 tenor 3/6/12, berlaku statement berikutnya. Cash advance tidak bisa dicicil, biaya 4% min Rp 50.000.
Naik limit: review 6 bulan / on-demand slip gaji, 3 hd. Overlimit bisa ditolak atau kena biaya.
Autodebet dari rekening tautan. Pelunasan penuh + bunga berjalan sebelum tutup kartu.`,
  },
  {
    id: "PB-CARD-SECURE",
    title: "Keamanan kartu: blokir, 3DS, LN, e-com",
    keywords: [
      "blokir kartu",
      "hilang",
      "dicuri",
      "3ds",
      "3d secure",
      "luar negeri",
      "e-commerce",
      "ecom",
      "tap to pay",
      "nfc",
      "travel",
    ],
    briefing: `Hilang/dicuri: blokir < 3 menit, tinjau 24 jam, kartu pengganti 3–7 hd. CS tidak minta CVV/OTP 3DS.
Flag e-com dan internasional bisa dimatikan di aplikasi tanpa blokir chip. Travel notify opsional untuk cegah false decline.
3DS wajib e-commerce. Tap to pay NFC hanya di device terikat. Contactless limit mengikuti skema.
Dispute tidak dikenali: 60 hari dari statement, chargeback 45–90 hari. PIN-based lebih sulit di-chargeback.`,
  },
  {
    id: "PB-LOAN",
    title: "Pinjaman KTA, KPR, KKB, KUR, Paylater",
    keywords: [
      "pinjam",
      "pinjem",
      "minjem",
      "kta",
      "kpr",
      "kkb",
      "kur",
      "paylater",
      "plafon",
      "angsuran",
      "syarat pinjam",
      "kredit rumah",
      "kredit motor",
      "ao",
      "account officer",
      "rm",
      "underwriter",
      "appraisal",
      "slik",
      "akad",
      "ltv",
    ],
    briefing: `KTA tanpa agunan, tenor 12–36 bln, rate board 14,90% p.a., plafon umumnya < Rp 300 jt, putusan 2 hd, cair H+1.
KPR hingga 20 th, 8,25–8,50%, LTV sesuai BI, appraisal + asuransi jiwa & kebakaran, 15–21 hd. Takeover: outstanding bank asal + roya. Janji temu AO KPR di cabang tanpa KYC ulang pada sesi demo.
KKB 12–60 bln, 7,90%, BPKB di bank sampai lunas, asuransi comprehensive th-1.
KUR 6% p.a., UMKM, NIB/SKU + omzet, 12–60 bln. Plafon besar (mis. 1 miliar) biasanya KPR/KUR+agunan, bukan KTA.
Paylater limit dinamis, 1,50%/bulan, 1–12 bln. DBR angsuran semua fasilitas ±35–40% penghasilan. SLIK kol 1. CS tidak janjikan approve.`,
  },
  {
    id: "PB-LOAN-CARE",
    title: "Tunggakan, restruk, pelunasan, SLIK, roya",
    keywords: [
      "tunggak",
      "telat bayar",
      "denda",
      "restruk",
      "pelunasan",
      "lunas",
      "slik",
      "kolektibilitas",
      "roya",
      "bpkb",
      "skl",
    ],
    briefing: `Denda harian sesuai akad. Kol naik 30/90/120 hari. Tawarkan bayar/restruk sebelum 90 hari. Collection eksternal: jangan tawar diskon sendiri.
Restruk: form kesulitan, simulasi, addendum, 10 hd, cabang. Ubah tenor KTA hanya lewat restruk.
Pelunasan dipercepat: pokok + bunga berjalan + penalty akad, simpulan berlaku 7 hari, SKL 3 hd. KPR roya 7–14 hd setelah SKL. BPKB KKB diserahkan setelah lunas.
SLIK dilaporkan berkala. CS tidak menghapus SLIK; koreksi resmi bila sengketa. Perbaikan muncul setelah bayar + periode lapor.`,
  },
  {
    id: "PB-SAVINGS",
    title: "Tabungan, giro, dormant, tutup rekening",
    keywords: [
      "tabungan",
      "buka rekening",
      "giro",
      "saldo",
      "dormant",
      "tutup rekening",
      "admin",
      "bunga tabungan",
      "saldo mengendap",
    ],
    briefing: `BangTabungan Digital: tanpa buku, bunga harian 2,00–2,80% dikredit awal bulan, admin Rp 11.000/3 bln (bebas bila saldo rata-rata terpenuhi).
BangTabungan Rencana: autodebet, 3,50% p.a. BangGiro Usaha: 1,00%, admin Rp 25.000/3 bln, cek/BG.
Dormant 12 bulan tanpa mutasi: aktivasi setoran min Rp 50.000 atau cabang + KTP; >24 bln biaya Rp 15.000 + mungkin refresh KYC.
Tutup rekening: tidak boleh ada linkage kartu/pinjaman/autodebet/investasi. Sisa saldo transfer rekening sama nama. 1 hd.
Rekening anak 0–17 wali. Joint AND: tarik besar butuh kedua pihak.`,
  },
  {
    id: "PB-DEPOSIT",
    title: "Deposito, ARO, break, gadai",
    keywords: ["deposito", "aro", "bilyet", "break", "penalti", "gadai deposito", "tenor"],
    briefing: `Min Rp 10 jt. Board: 1 bln 3,50%; 3 bln 4,25%; 6 bln 4,75%; 12 bln 5,10% (+0,10% dana baru program berjalan). ARO pokok atau pokok+bunga.
Break sebelum JT: penalti bunga, pokok H+0 sebelum 15.00. Deposito digadai (LTV s.d. 90%) tidak bisa di-break.
Pajak bunga PPh sesuai ketentuan. Dijamin LPS bila bunga ≤ tingkat penjaminan. E-bilyet ke email.`,
  },
  {
    id: "PB-WEALTH",
    title: "Investasi reksa dana, SBN, risiko",
    keywords: [
      "investasi",
      "reksa",
      "reksadana",
      "nav",
      "wealth",
      "sbn",
      "obligasi",
      "switching",
      "redemption",
      "profil risiko",
    ],
    briefing: `Wajib profil risiko. Order beli cut-off 13.00 WIB. Unit: RDPU T+1, RDPT T+2, RDS T+3. Switch T+2–T+4. NAV H+1 hari bursa.
Tidak dijamin LPS. CS tidak menjanjikan imbal hasil. Profil konservatif tidak ditawari saham murni tanpa konfirmasi.
SBN/ORI: kuota pemerintah, settlement sesuai seri. Bancassurance klaim ke mitra asuransi, bank bantu dokumen.`,
  },
  {
    id: "PB-INSURANCE",
    title: "Asuransi kredit dan bancassurance",
    keywords: ["asuransi", "klaim", "premi", "polis", "jiwa kredit", "kebakaran", "bangproteksi"],
    briefing: `KPR: jiwa kredit + kebakaran wajib. KKB: comprehensive tahun pertama. Klaim meninggal dapat menutup sisa pokok sesuai polis.
BangProteksi Sejahtera: klaim ke panel, CS tidak janjikan hasil. Premi mengikuti akad. Pengecualian sesuai polis (pre-existing, dll).`,
  },
  {
    id: "PB-KYC",
    title: "CIF, KYC, ubah data, ahli waris",
    keywords: [
      "kyc",
      "cif",
      "ubah data",
      "ganti hp",
      "ganti alamat",
      "ganti email",
      "ktp",
      "npwp",
      "ahli waris",
      "meninggal",
      "refresh",
    ],
    briefing: `KYC 3 tahun / trigger risiko. update_required membatasi naik limit. Refresh: KTP + liveness, 1 hd.
Ubah HP/email/alamat: OTP, notifikasi ke kontak lama. NIK/nama hanya perbaikan Dukcapil. Status menikah: akta.
Meninggal: akta kematian, blokir semua fasilitas, bayar ahli waris 14 hd setelah dokumen lengkap. Sengketa ditahan Legal.
FATCA/CRS: US person wajib isi formulir. PEP eskalasi Compliance.`,
  },
  {
    id: "PB-FRAUD",
    title: "Fraud, phishing, OTP, remote access",
    keywords: [
      "fraud",
      "phishing",
      "scam",
      "penipuan",
      "otp",
      "link palsu",
      "remote",
      "anydesk",
      "wajib lapor",
      "rekening dikuras",
    ],
    briefing: `CS/bank tidak pernah minta OTP, PIN, CVV, password. Jika sudah dibocorkan: blokir aplikasi+kartu+token sekarang, ganti PIN, tiket fraud, saran polisi bila rugi material.
Remote access / lowongan / investasi bodong / mengaku CS: sama. Transaksi yang sudah jalan mungkin tidak bisa dibatalkan.
Jangan tipping-off AML. Hold aparat/AML tidak dibuka CS.`,
  },
  {
    id: "PB-COMPLAINT",
    title: "Pengaduan, tiket, OJK, LAPS",
    keywords: ["komplain", "pengaduan", "tiket", "ojk", "laps", "keberatan", "mediasi"],
    briefing: `Setiap keluhan wajib tiket BDCS-YYMMDD-#####. Ack 2 hd, selesai 20 hd (bisa perpanjang 20 hd bila pihak ketiga).
Nasabah bisa ke OJK dan LAPS SJK setelah internal selesai / molor. CS jangan menyalahkan nasabah. Beri nomor tiket selalu.
Cek status: sebut nomor tiket. Jangan buat tiket untuk pertanyaan how-to murni.`,
  },
  {
    id: "PB-LIMIT",
    title: "Limit harian, cooling-off, transaksi ditolak",
    keywords: ["limit", "ditolak", "cooling", "naikkan limit", "limit harian", "limit qris"],
    briefing: `Personal: QRIS 10 jt, BI-FAST 25 jt, ATM 10 jt/hari. Affluent 25/50/15. Priority 50/100/20. SME 25/250/15.
Naik limit di aplikasi: PIN+OTP. Kenaikan >2x atau perangkat baru: cooling-off 24 jam. CIF update_required tidak boleh naik.
Transaksi ditolak: cek sisa limit, saldo available vs hold, status kartu/rekening, device binding.`,
  },
  {
    id: "PB-STATEMENT",
    title: "Mutasi, statement, surat keterangan, pajak",
    keywords: [
      "mutasi",
      "statement",
      "rekening koran",
      "skn",
      "surat keterangan",
      "bukti potong",
      "pajak",
      "visa",
      "pdf",
    ],
    briefing: `Mutasi digital 10 tahun. PDF 12 bulan langsung; arsip >1 tahun 1 hd ke email terdaftar.
Surat keterangan rekening / visa: cabang 1 hd, bermaterai atas permintaan. Pengadilan via Legal.
Bukti potong bunga: Januari untuk tahun pajak sebelumnya. Restitusi bukan wewenang CS.`,
  },
  {
    id: "PB-CONTACT",
    title: "Kontak dan jam layanan",
    keywords: [
      "kontak",
      "contact",
      "hubungi",
      "call center",
      "jam",
      "operasional",
      "cabang",
      "cs siapa",
      "ao",
      "fo",
      "pinca",
      "pincapem",
      "kaunit",
      "mantri",
      "janji temu",
      "appointment",
    ],
    briefing: `Live CS Sabina: sabina.rominur.com (chat ini) 24/7 untuk inquiry + tiket.
Call center fiksi 1500-BANG. Cabang/KCP Senin–Jumat 08.00–15.00 WIB. ATM 24 jam. CRM 05.00–22.00. Digital 24/7 kecuali maintenance.
Janji temu cabang bisa ke AO, RM, FO, Pinca, Pincapem, Kaunit, Mantri, teller, atau priority lounge. Appointment prioritas di aplikasi. Libur nasional: cabang tutup, ATM/QRIS/BI-FAST tetap jalan.`,
  },
  {
    id: "PB-LPS",
    title: "LPS dan produk yang tidak dijamin",
    keywords: ["lps", "penjaminan", "dijamin", "2 miliar"],
    briefing: `Simpanan dijamin LPS s.d. Rp 2 miliar per nasabah per bank, bunga tidak boleh melebihi tingkat penjaminan. Tabungan+giro+deposito dihitung gabungan.
Reksa dana, SBN di luar simpanan, bancassurance, dan unit link tidak dijamin LPS.`,
  },
  {
    id: "PB-PROMO",
    title: "Promo, cashback, reward",
    keywords: ["promo", "cashback", "reward", "poin", "diskon"],
    briefing: `BI-FAST gratis 10x/bulan BangTabungan Digital. Cashback 5% F&B Gold/Platinum max Rp 50.000/transaksi, posting H+3 s.d. akhir bulan, exclude tunai/transfer.
Deposito 12 bulan +0,10% dana baru bulan berjalan. CS tidak menambah promo di luar board.`,
  },
  {
    id: "PB-SME",
    title: "SME: giro, payroll, VA, escrow, maker-checker",
    keywords: ["payroll", "gaji", "sme", "usaha", "bulk", "escrow", "maker", "checker", "nib"],
    briefing: `Payroll file H-1 pukul 16.00, kredit H+0 pagi. Baris rekening salah ditolak, lainnya jalan.
Maker-checker untuk giro korporasi. BangVA Merchant invoicing. Escrow hanya mitra developer berakad — CS tidak override release.
Onboarding SME: NIB, NPWP badan, pengurus, beneficial owner.`,
  },
  {
    id: "PB-PDPL",
    title: "Data pribadi, PDPL, marketing",
    keywords: ["pdpl", "data pribadi", "hapus akun", "privasi", "marketing", "setuju"],
    briefing: `Nasabah bisa unduh ringkasan data dan cabut consent marketing di aplikasi. Hapus CIF tidak bisa jika masih ada kewajiban/retensi regulasi.
CS tidak membagikan data ke pihak ketiga tanpa dasar. Permintaan aparat lewat Legal.`,
  },
  {
    id: "PB-HOLD",
    title: "Hold dana, sita, AML",
    keywords: ["hold", "tahan dana", "sita", "aml", "beku", "blokir rekening"],
    briefing: `Hold bisa karena AML, sita, dispute, gaji screening. Jelaskan dana belum available secara umum. Jangan tipping-off.
Eskalasi unit pemilik hold. Unblokir hold aparat/AML bukan wewenang CS.`,
  },
  {
    id: "PB-FX",
    title: "Kurs dan konversi valas",
    keywords: ["kurs", "valas", "usd", "dollar", "tukar", "sgd", "eur", "jpy"],
    briefing: `Pakai papan kurs hari ini (beli/jual). Quotation berlaku singkat. Akhir pekan mengikuti kurs terakhir + flag.
Deposito valas tersedia di cabang tertentu. Konversi spread sudah termasuk di jual/beli.`,
  },
];

export function matchPlaybooks(message: string, k = 5): Playbook[] {
  const q = message.toLowerCase();
  const ranked = PLAYBOOKS.map((p) => {
    let score = 0;
    for (const kw of p.keywords) {
      if (kw.length > 2 && q.includes(kw)) score += kw.split(" ").length > 1 ? 3 : 1.4;
    }
    const titleHit = p.title.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3 && q.includes(w));
    score += titleHit.length * 0.4;
    return { p, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return ranked.slice(0, k).map((x) => x.p);
}

export function formatPlaybooks(books: Playbook[]): string {
  if (!books.length) return "";
  return [
    "=== PLAYBOOK LAYANAN DIGITAL (wajib dipakai) ===",
    ...books.map((b) => `[${b.id}] ${b.title}\n${b.briefing}`),
  ].join("\n\n");
}

export function serviceCatalogBrief(): string {
  return `Cakupan layanan yang WAJIB dijawab (jangan ditolak sebagai di luar tugas):
CIF/KYC, tabungan, giro, deposito, transfer in-bank/BI-FAST/RTGS/SKN/SWIFT, QRIS, VA, e-wallet, pulsa/tagihan, ATM/CRM, kartu debit/kredit, KTA/KPR/KKB/KUR/Paylater, investasi, asuransi, limit, mutasi/statement, lokasi/jam, promo, LPS, pengaduan/tiket, fraud, aplikasi, device binding, SME/payroll.
Bahasa informal (pinjem, duit, contact, kak, tf, kk) tetap pertanyaan bank. Jawab syarat, kanal, SLA, dan data nasabah yang ada.`;
}
