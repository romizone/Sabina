import { expandSops } from "./expand";
import type { SopDocument } from "../types";

type Draft = {
  category: string;
  title: string;
  keywords: string[];
  summary: string;
  steps: string[];
  sla: string;
  channels: string[];
  exceptions: string[];
  products: string[];
};

const PRODUCTS = [
  "BangTabungan Digital",
  "BangTabungan Rencana",
  "BangGiro Usaha",
  "BangDeposito",
  "BangKartu Debit",
  "BangKartu Classic",
  "BangKartu Gold",
  "BangKartu Platinum",
  "BangPinjam KTA",
  "BangKUR",
  "BangKPR",
  "BangKKB",
  "BangPaylater",
  "BangInvest Pasar Uang",
  "BangInvest Pendapatan Tetap",
  "BangInvest Saham Nusantara",
  "BangObligasi Negara Ritel",
  "BangProteksi Sejahtera",
] as const;

function sop(
  prefix: string,
  index: number,
  draft: Draft,
): SopDocument {
  return {
    id: `SOP-${prefix}-${String(index).padStart(3, "0")}`,
    ...draft,
  };
}

function coreSops(): SopDocument[] {
  const items: SopDocument[] = [];
  let n = 1;
  const add = (prefix: string, draft: Draft) => {
    items.push(sop(prefix, n, draft));
    n += 1;
  };

  add("CIF", {
    category: "CIF & KYC",
    title: "Pembukaan CIF nasabah individu baru",
    keywords: ["cif", "buka rekening", "kyc", "ktp", "nasabah baru"],
    summary:
      "Prosedur membuat CIF baru untuk individu WNI melalui aplikasi Bang Digital atau cabang, termasuk e-KYC dan verifikasi liveness.",
    steps: [
      "Minta KTP asli / foto KTP dan selfie liveness.",
      "Cek dukcapil dan screening AML/PEP.",
      "Isi data CIF: nama, ibu kandung, alamat, pekerjaan, NPWP bila ada.",
      "Tentukan segmen awal Personal dan risk rating.",
      "Aktifkan CIF lalu tawarkan produk simpanan pertama.",
    ],
    sla: "15 menit digital / 45 menit cabang",
    channels: ["Aplikasi Bang", "Cabang", "Video Banking"],
    exceptions: ["WNI di bawah 17 tahun butuh wali", "PEP wajib eskalasi Compliance"],
    products: ["BangTabungan Digital"],
  });

  add("CIF", {
    category: "CIF & KYC",
    title: "Perubahan data CIF alamat dan nomor HP",
    keywords: ["ubah data", "update cif", "ganti hp", "ganti alamat", "e-ktp"],
    summary: "Nasabah dapat mengubah data kontak setelah otentikasi 2FA. Perubahan NIK tidak diizinkan tanpa proses khusus Dukcapil.",
    steps: [
      "Otentikasi: PIN + OTP atau video KYC.",
      "Ubah alamat/HP/email pada menu Profil.",
      "Kirim notifikasi ke HP dan email lama bila masih aktif.",
      "Catat log perubahan pada CIF history.",
    ],
    sla: "langsung setelah OTP",
    channels: ["Aplikasi Bang", "Cabang"],
    exceptions: ["Ganti NIK / nama = proses perbaikan Dukcapil"],
    products: [],
  });

  add("CIF", {
    category: "CIF & KYC",
    title: "Refresh KYC periodik 3 tahun",
    keywords: ["kyc", "update data", "kedaluwarsa", "refresh kyc"],
    summary: "KYC wajib diperbarui setiap 3 tahun atau saat ada trigger risiko. Status update_required membatasi kenaikan limit.",
    steps: [
      "Sistem menandai CIF update_required 30 hari sebelum jatuh tempo.",
      "Nasabah unggah KTP dan liveness.",
      "Petugas meninjau bila risk medium/high.",
      "Pulihkan status verified.",
    ],
    sla: "1 hari kerja setelah dokumen lengkap",
    channels: ["Aplikasi Bang", "Cabang"],
    exceptions: ["Nasabah luar negeri via video banking"],
    products: [],
  });

  add("CIF", {
    category: "CIF & KYC",
    title: "Penutupan CIF karena nasabah meninggal",
    keywords: ["meninggal", "ahli waris", "penutupan cif", "surat kematian"],
    summary: "CIF ditutup setelah verifikasi akta kematian dan penetapan ahli waris. Saldo diserahkan sesuai ketentuan.",
    steps: [
      "Terima akta kematian dan KTP ahli waris.",
      "Blokir seluruh rekening dan kartu.",
      "Hitung saldo simpanan, outstanding pinjaman, dan investasi.",
      "Bayarkan ke ahli waris sesuai surat keterangan waris / penetapan pengadilan.",
    ],
    sla: "14 hari kerja setelah dokumen lengkap",
    channels: ["Cabang"],
    exceptions: ["Sengketa waris ditahan Compliance"],
    products: [],
  });

  add("TAB", {
    category: "Simpanan",
    title: "Pembukaan BangTabungan Digital",
    keywords: ["buka tabungan", "rekening baru", "bangtabungan"],
    summary: "Tabungan utama tanpa buku, bunga harian, kartu debit virtual + fisik opsional.",
    steps: [
      "Pastikan CIF verified.",
      "Setujui syarat rekening dan LPS.",
      "Generate nomor rekening 88xxxxxxxxxx.",
      "Aktifkan transfer BI-FAST dan QRIS.",
    ],
    sla: "5 menit",
    channels: ["Aplikasi Bang"],
    exceptions: ["Dormant CIF lama harus diaktifkan dulu"],
    products: ["BangTabungan Digital"],
  });

  add("TAB", {
    category: "Simpanan",
    title: "Cek saldo tabungan dan giro",
    keywords: ["saldo", "cek saldo", "balance", "rekening"],
    summary: "CS menyampaikan saldo available, hold, dan saldo mengendap. Jangan sebut saldo rekening lain tanpa otentikasi.",
    steps: [
      "Otentikasi 3 data: CIF/rekening, tanggal lahir, nama ibu kandung.",
      "Baca saldo available dari core.",
      "Jelaskan bila ada hold kartu/transfer.",
    ],
    sla: "langsung",
    channels: ["Live CS", "Aplikasi Bang", "ATM"],
    exceptions: ["Hold fraud: arahkan ke unit fraud"],
    products: ["BangTabungan Digital", "BangGiro Usaha"],
  });

  add("TAB", {
    category: "Simpanan",
    title: "Rekening dormant dan aktivasi ulang",
    keywords: ["dormant", "tidak aktif", "aktivasi rekening"],
    summary: "Rekening tanpa mutasi 12 bulan menjadi dormant. Aktivasi butuh transaksi kredit atau konfirmasi cabang.",
    steps: [
      "Cek tanggal mutasi terakhir.",
      "Minta setoran atau transfer masuk minimal Rp 50.000.",
      "Atau aktivasi cabang dengan KTP.",
      "Biaya aktivasi Rp 15.000 bila lewat 24 bulan.",
    ],
    sla: "saat itu juga setelah setoran",
    channels: ["Cabang", "Aplikasi Bang"],
    exceptions: ["Dormant + update KYC wajib refresh KYC"],
    products: ["BangTabungan Digital"],
  });

  add("TAB", {
    category: "Simpanan",
    title: "Penutupan rekening tabungan",
    keywords: ["tutup rekening", "penutupan tabungan"],
    summary: "Rekening dapat ditutup jika tidak menautkan pinjaman, kartu, atau autodebet aktif.",
    steps: [
      "Cek linkage kartu, VA, autodebet, dan investasi.",
      "Cairkan bunga berjalan.",
      "Transfer sisa saldo ke rekening lain atas nama yang sama.",
      "Tutup rekening dan cetak surat keterangan.",
    ],
    sla: "1 hari kerja",
    channels: ["Cabang", "Aplikasi Bang"],
    exceptions: ["Masih ada outstanding kartu/pinjaman"],
    products: ["BangTabungan Digital", "BangTabungan Rencana"],
  });

  add("DEP", {
    category: "Deposito",
    title: "Pembukaan BangDeposito",
    keywords: ["deposito", "buka deposito", "aro", "bunga deposito"],
    summary: "Deposito 1/3/6/12 bulan, ARO otomatis, bunga ke rekening sumber. Dijamin LPS sesuai ketentuan.",
    steps: [
      "Pilih tenor dan nominal minimal Rp 10.000.000.",
      "Tentukan ARO pokok atau ARO + bunga.",
      "Debet rekening sumber.",
      "Kirim e-bilyet ke email nasabah.",
    ],
    sla: "10 menit",
    channels: ["Aplikasi Bang", "Cabang"],
    exceptions: ["Pencairan sebelum jatuh tempo: penalti bunga"],
    products: ["BangDeposito"],
  });

  add("DEP", {
    category: "Deposito",
    title: "Pencairan deposito sebelum jatuh tempo",
    keywords: ["cair deposito", "break deposito", "penalti"],
    summary: "Break deposito dikenakan penalti bunga berjalan dan tidak mendapat bunga proporsional bulan berjalan.",
    steps: [
      "Konfirmasi bilyet dan tenor tersisa.",
      "Hitung penalti sesuai board rate.",
      "Kredit pokok ke rekening sumber H+0.",
    ],
    sla: "H+0 sebelum pukul 15.00 WIB",
    channels: ["Cabang", "Aplikasi Bang"],
    exceptions: ["Deposito gadai sebagai agunan tidak dapat di-break"],
    products: ["BangDeposito"],
  });

  add("TRF", {
    category: "Transfer & Pembayaran",
    title: "Transfer BI-FAST keluar",
    keywords: ["transfer", "bi-fast", "bifast", "kirim uang"],
    summary: "Transfer realtime antarbank 24/7 dengan limit harian sesuai segmen dan perangkat terdaftar.",
    steps: [
      "Validasi rekening tujuan dan nama.",
      "Cek limit harian dan saldo available.",
      "OTP / biometrik.",
      "Kirim dan simpan reference BI-FAST.",
    ],
    sla: "< 1 menit",
    channels: ["Aplikasi Bang", "ATM"],
    exceptions: ["Nama tidak match: tampilkan konfirmasi risiko"],
    products: ["BangTabungan Digital", "BangGiro Usaha"],
  });

  add("TRF", {
    category: "Transfer & Pembayaran",
    title: "Transfer gagal atau pending",
    keywords: ["transfer gagal", "pending", "uang tertahan", "belum masuk"],
    summary: "Pending > 15 menit dicek ke switch. Jika debet sudah terjadi dan kredit belum, lakukan recon dan refund otomatis H+1 paling lambat.",
    steps: [
      "Minta reference, jam, nominal, rekening tujuan.",
      "Cek status core dan switch.",
      "Jika sukses di kita gagal di tujuan: refund.",
      "Berikan nomor tiket pengaduan.",
    ],
    sla: "1x24 jam untuk refund otomatis, 3 hari kerja investigasi manual",
    channels: ["Live CS", "Aplikasi Bang"],
    exceptions: ["RTGS cut-off diulang H+1"],
    products: [],
  });

  add("TRF", {
    category: "Transfer & Pembayaran",
    title: "RTGS dan SKN",
    keywords: ["rtgs", "skn", "kliring", "transfer besar"],
    summary: "RTGS untuk nominal besar same-day sebelum 14.30 WIB. SKN batch beberapa kali sehari.",
    steps: [
      "Pastikan data bank tujuan  dan berita.",
      "Debet + biaya RTGS/SKN.",
      "Kirim ke BI.",
      "Beritahu ETA sesuai cut-off.",
    ],
    sla: "RTGS H+0, SKN H+0/H+1",
    channels: ["Cabang", "Aplikasi Bang (giro)"],
    exceptions: ["Setelah cut-off diproses hari kerja berikutnya"],
    products: ["BangGiro Usaha"],
  });

  add("QR", {
    category: "QRIS",
    title: "Pembayaran QRIS merchant",
    keywords: ["qris", "scan qris", "bayar qris"],
    summary: "Pembayaran QRIS debet rekening utama. Limit per transaksi dan harian berbeda per segmen.",
    steps: [
      "Scan MPM atau tap NFC.",
      "Konfirmasi merchant dan nominal.",
      "PIN.",
      "Kirim notifikasi dan catat RRN.",
    ],
    sla: "realtime",
    channels: ["Aplikasi Bang"],
    exceptions: ["QR kadaluarsa / merchant nonaktif"],
    products: ["BangTabungan Digital"],
  });

  add("QR", {
    category: "QRIS",
    title: "Refund QRIS salah bayar",
    keywords: ["refund qris", "salah transfer qris", "qris gagal"],
    summary: "Refund QRIS hanya jika merchant menyetujui atau switch menandai gagal. CS tidak bisa memaksa refund tanpa bukti.",
    steps: [
      "Minta bukti screenshot dan RRN.",
      "Cek status settlement.",
      "Ajukan refund ke acquirer bila eligible.",
      "Dana kembali 1-7 hari kerja.",
    ],
    sla: "7 hari kerja",
    channels: ["Live CS"],
    exceptions: ["Dispute chargeback merchant 14 hari"],
    products: [],
  });

  add("ATM", {
    category: "ATM & Debit",
    title: "Tarik tunai ATM Bang Digital",
    keywords: ["tarik tunai", "atm", "withdraw"],
    summary: "Limit tarik tunai default Rp 10 juta/hari, dapat dinaikkan di aplikasi setelah device binding.",
    steps: [
      "Masukkan kartu atau tarik tanpa kartu via QR ATM.",
      "PIN debit.",
      "Pilih nominal kelipatan Rp 50.000.",
      "Ambil tunai dan bukti.",
    ],
    sla: "realtime",
    channels: ["ATM", "CRM"],
    exceptions: ["Kartu terblokir / rekening hold"],
    products: ["BangKartu Debit"],
  });

  add("ATM", {
    category: "ATM & Debit",
    title: "Uang tidak keluar di ATM",
    keywords: ["atm tidak keluar", "uang tidak keluar", "atm error", "double debet"],
    summary: "Jika ATM gagal dispense tetapi rekening terdebet, lakukan recon. Refund otomatis maksimal 1x24 jam, manual 7 hari kerja.",
    steps: [
      "Minta lokasi ATM, jam, nominal, dan bukti.",
      "Cek journal ATM dan core.",
      "Buka tiket channel ATM.",
      "Refund bila journal gagal dispense.",
    ],
    sla: "1x24 jam auto / 7 hari kerja manual",
    channels: ["Live CS"],
    exceptions: ["ATM bank lain mengikuti aturan ATM Bersama/Prima"],
    products: ["BangKartu Debit"],
  });

  add("ATM", {
    category: "ATM & Debit",
    title: "Kartu tertelan ATM",
    keywords: ["kartu tertelan", "atm telan kartu", "ambil kartu"],
    summary: "Kartu tertelan dapat diambil di cabang pengelola ATM dengan KTP dalam 2 hari kerja, atau diblokir dan diterbitkan kartu baru.",
    steps: [
      "Blokir kartu segera.",
      "Catat ID ATM dan waktu.",
      "Opsi ambil kartu atau terbitkan baru.",
    ],
    sla: "blokir langsung, ambil kartu 2 hari kerja",
    channels: ["Live CS", "Cabang"],
    exceptions: ["Indikasi skimming: wajib kartu baru"],
    products: ["BangKartu Debit"],
  });

  add("PIN", {
    category: "Keamanan",
    title: "Reset PIN debit atau aplikasi",
    keywords: ["lupa pin", "reset pin", "ganti pin"],
    summary: "Reset PIN wajib otentikasi kuat. Jangan minta nasabah menyebut PIN lama kepada CS.",
    steps: [
      "Otentikasi CIF + DOB + ibu kandung + OTP.",
      "Kirim tautan reset atau video banking.",
      "Nasabah membuat PIN baru 6 digit.",
      "Device binding diulang.",
    ],
    sla: "15 menit",
    channels: ["Aplikasi Bang", "Live CS", "Video Banking"],
    exceptions: ["3x salah PIN = blokir kartu/aplikasi"],
    products: ["BangKartu Debit"],
  });

  add("CRD", {
    category: "Kartu Kredit",
    title: "Pengajuan BangKartu Kredit",
    keywords: ["ajukan kartu kredit", "buka kartu", "limit kartu"],
    summary: "Pengajuan kartu berdasarkan penghasilan, skor internal, dan hubungan rekening. Keputusan 1-3 hari kerja.",
    steps: [
      "Isi aplikasi dan unggah slip gaji / rekening koran.",
      "Scoring dan verifikasi telepon.",
      "Terbitkan kartu virtual dulu, fisik menyusul.",
    ],
    sla: "3 hari kerja",
    channels: ["Aplikasi Bang", "Cabang"],
    exceptions: ["Daftar hitam / kolektibilitas buruk ditolak"],
    products: ["BangKartu Classic", "BangKartu Gold", "BangKartu Platinum"],
  });

  add("CRD", {
    category: "Kartu Kredit",
    title: "Cek tagihan dan tanggal jatuh tempo kartu kredit",
    keywords: ["tagihan kartu", "jatuh tempo", "minimum payment", "cc bill"],
    summary: "CS menyampaikan total tagihan, minimum payment, bunga berjalan, dan tanggal jatuh tempo. Jangan menekan pelunasan penuh jika nasabah hanya mampu minimum.",
    steps: [
      "Otentikasi 3 data + 4 digit terakhir kartu.",
      "Baca statement siklus berjalan.",
      "Jelaskan bunga jika bayar minimum.",
    ],
    sla: "langsung",
    channels: ["Live CS", "Aplikasi Bang"],
    exceptions: ["Kartu late: tawarkan rencana bayar"],
    products: ["BangKartu Classic", "BangKartu Gold", "BangKartu Platinum"],
  });

  add("CRD", {
    category: "Kartu Kredit",
    title: "Blokir kartu hilang atau dicuri",
    keywords: ["kartu hilang", "blokir kartu", "dicuri", "lost card"],
    summary: "Blokir permanen segera setelah laporan. Transaksi setelah waktu laporan menjadi tanggung jawab bank bila sistem menolaknya.",
    steps: [
      "Otentikasi cepat (CIF + ibu kandung).",
      "Blokir kartu hot-card.",
      "Tinjau transaksi 24 jam terakhir.",
      "Tawarkan kartu pengganti.",
    ],
    sla: "blokir < 3 menit",
    channels: ["Live CS", "Aplikasi Bang"],
    exceptions: ["Ada transaksi unrecognized: buka dispute"],
    products: ["BangKartu Debit", "BangKartu Classic", "BangKartu Gold", "BangKartu Platinum"],
  });

  add("CRD", {
    category: "Kartu Kredit",
    title: "Dispute transaksi kartu tidak dikenali",
    keywords: ["dispute", "transaksi tidak kenal", "chargeback", "fraud kartu"],
    summary: "Nasabah dapat mengajukan dispute 60 hari sejak statement. Temporary credit dapat diberikan untuk kasus fraud kuat.",
    steps: [
      "Kunci transaksi dan minta kronologi.",
      "Blokir kartu bila fraud.",
      "Ajukan chargeback ke skema.",
      "Informasikan SLA 45-90 hari.",
    ],
    sla: "45-90 hari kalender",
    channels: ["Live CS", "Aplikasi Bang"],
    exceptions: ["PIN-based transaction lebih sulit di-chargeback"],
    products: ["BangKartu Classic", "BangKartu Gold", "BangKartu Platinum"],
  });

  add("LN", {
    category: "Pinjaman",
    title: "Simulasi dan pengajuan BangPinjam KTA",
    keywords: ["kta", "pinjaman tunai", "ajukan pinjaman", "simulasi angsuran"],
    summary: "KTA tanpa agunan, tenor 12-36 bulan, pencairan ke rekening Bang Digital.",
    steps: [
      "Simulasi angsuran dan kemampuan bayar.",
      "Cek BI checking / SLIK.",
      "Putusan kredit.",
      "Pencairan H+1 setelah akad.",
    ],
    sla: "putusan 2 hari kerja",
    channels: ["Aplikasi Bang", "Cabang"],
    exceptions: ["Kolektibilitas > 2 ditolak"],
    products: ["BangPinjam KTA"],
  });

  add("LN", {
    category: "Pinjaman",
    title: "Pengajuan BangKPR",
    keywords: ["kpr", "kredit rumah", "ajukan kpr"],
    summary: "KPR hingga 20 tahun, LTV mengikuti ketentuan BI, wajib appraisal dan asuransi jiwa + kebakaran.",
    steps: [
      "Pra-approval penghasilan.",
      "Appraisal agunan.",
      "Akad notaris dan SKMHT/APHT.",
      "Pencairan ke penjual / developer.",
    ],
    sla: "15-21 hari kerja",
    channels: ["Cabang", "Aplikasi Bang"],
    exceptions: ["Agunan sengketa ditolak"],
    products: ["BangKPR"],
  });

  add("LN", {
    category: "Pinjaman",
    title: "Angsuran menunggak dan denda",
    keywords: ["telat bayar", "tunggakan", "denda", "kolektibilitas", "npl"],
    summary: "Denda keterlambatan dihitung harian. Kolektibilitas naik setelah 30/90/120 hari. CS menawarkan restruktur sebelum 90 hari.",
    steps: [
      "Sebut sisa hari dan nominal menunggak + denda.",
      "Tawarkan bayar sebagian untuk turun kolektibilitas.",
      "Bila kesulitan, eskalasi collection / restruk.",
    ],
    sla: "informasi langsung",
    channels: ["Live CS"],
    exceptions: ["Sudah diserahkan ke collection eksternal"],
    products: ["BangPinjam KTA", "BangKPR", "BangKKB", "BangPaylater"],
  });

  add("LN", {
    category: "Pinjaman",
    title: "Pelunasan dipercepat",
    keywords: ["lunasi pinjaman", "pelunasan dipercepat", "early repayment"],
    summary: "Pelunasan dipercepat dihitung outstanding pokok + bunga berjalan + penalty sesuai akad.",
    steps: [
      "Minta tanggal rencana lunas.",
      "Generate simpulan pelunasan berlaku 7 hari.",
      "Debet rekening atau RTGS.",
      "Terbitkan surat lunas dan roya untuk KPR.",
    ],
    sla: "surat lunas 3 hari kerja",
    channels: ["Cabang", "Aplikasi Bang"],
    exceptions: ["KPR subsidi mengikuti aturan kementerian"],
    products: ["BangPinjam KTA", "BangKPR", "BangKKB"],
  });

  add("WM", {
    category: "Wealth Management",
    title: "Subscription reksa dana BangInvest",
    keywords: ["beli reksadana", "subscription", "investasi", "wealth"],
    summary: "Nasabah wajib isi profil risiko. Penempatan sesuai risk profile. NAV menggunakan harga hari bursa.",
    steps: [
      "Lengkapi profil risiko.",
      "Pilih produk sesuai profil.",
      "Debet rekening, order ke MI.",
      "Unit terbentuk H+1 s.d. H+3.",
    ],
    sla: "unit Z+1 sampai Z+3",
    channels: ["Aplikasi Bang"],
    exceptions: ["Profil konservatif tidak ditawarkan saham murni tanpa konfirmasi"],
    products: ["BangInvest Pasar Uang", "BangInvest Pendapatan Tetap", "BangInvest Saham Nusantara"],
  });

  add("WM", {
    category: "Wealth Management",
    title: "Redemption reksa dana",
    keywords: ["jual reksadana", "redemption", "cair investasi"],
    summary: "Pencairan sebagian atau seluruh unit. Dana masuk rekening sesuai settlement fund.",
    steps: [
      "Cek unit tersedia dan cut-off 13.00 WIB.",
      "Kirim order jual.",
      "Settlement RDPU T+1, RDPT T+2, RDS T+3.",
    ],
    sla: "T+1 sampai T+3",
    channels: ["Aplikasi Bang"],
    exceptions: ["Force majeure pasar"],
    products: ["BangInvest Pasar Uang", "BangInvest Pendapatan Tetap", "BangInvest Saham Nusantara"],
  });

  add("FRD", {
    category: "Keamanan & Fraud",
    title: "Laporan phishing dan OTP dibocorkan",
    keywords: ["phishing", "otp", "penipuan", "scam", "link palsu"],
    summary: "Jika nasabah memberi OTP ke pihak lain, transaksi yang sudah jalan mungkin tidak dapat dibatalkan. Blokir kanal segera.",
    steps: [
      "Blokir aplikasi, kartu, dan token.",
      "Ganti PIN/password.",
      "Catat kronologi dan nomor pelaku.",
      "Buka tiket fraud dan saran laporan polisi bila kerugian material.",
    ],
    sla: "blokir langsung",
    channels: ["Live CS"],
    exceptions: ["CS tidak pernah minta OTP / PIN"],
    products: [],
  });

  add("FRD", {
    category: "Keamanan & Fraud",
    title: "Device binding dan perangkat baru",
    keywords: ["ganti hp", "device binding", "perangkat baru", "logout"],
    summary: "Login di perangkat baru wajib OTP + pertanyaan keamanan. Perangkat lama dapat dipaksa logout.",
    steps: [
      "Verifikasi OTP ke HP terdaftar.",
      "Ikat perangkat baru.",
      "Cabut perangkat lama atas permintaan.",
    ],
    sla: "10 menit",
    channels: ["Aplikasi Bang", "Live CS"],
    exceptions: ["HP hilang: ganti nomor dulu di cabang"],
    products: [],
  });

  add("CMP", {
    category: "Pengaduan",
    title: "Penerimaan pengaduan OJK / SLA 20 hari",
    keywords: ["pengaduan", "komplain", "ojk", "sla pengaduan"],
    summary: "Setiap pengaduan wajib tiket, ack 2 hari kerja, selesai 20 hari kerja atau perpanjangan tertulis.",
    steps: [
      "Buat tiket dan beri nomor.",
      "Klasifikasi: transaksi, kartu, pinjaman, data.",
      "Investigasi unit terkait.",
      "Kirim jawaban resmi.",
    ],
    sla: "20 hari kerja",
    channels: ["Live CS", "Cabang", "Email"],
    exceptions: ["Menunggu pihak ketiga dapat diperpanjang 20 hari"],
    products: [],
  });

  add("LPS", {
    category: "Kepatuhan",
    title: "Penjelasan penjaminan LPS",
    keywords: ["lps", "penjaminan", "2 miliar", "bunga lps"],
    summary: "Simpanan nasabah dijamin LPS hingga Rp 2 miliar per nasabah per bank, dengan syarat suku bunga tidak melebihi tingkat penjaminan.",
    steps: [
      "Jelaskan plafon Rp 2 miliar.",
      "Sebutkan rekening yang dihitung gabungan.",
      "Investasi reksa dana dan bancassurance tidak dijamin LPS.",
    ],
    sla: "langsung",
    channels: ["Live CS"],
    exceptions: ["Deposito bunga di atas LPS tidak dijamin"],
    products: ["BangTabungan Digital", "BangDeposito", "BangGiro Usaha"],
  });

  return items;
}

const ACTIONS: { action: string; title: (p: string) => string; keywords: (p: string) => string[]; summary: (p: string) => string; steps: (p: string) => string[]; sla: string; exceptions: string[] }[] = [
  {
    action: "limit",
    title: (p) => `Pengaturan limit transaksi ${p}`,
    keywords: (p) => ["limit", "naikkan limit", p.toLowerCase()],
    summary: (p) =>
      `Limit harian ${p} dapat diubah di aplikasi setelah otentikasi. Kenaikan signifikan butuh cooling-off 24 jam.`,
    steps: (p) => [
      `Buka menu Limit pada ${p}.`,
      "Otentikasi PIN + OTP.",
      "Kenaikan di atas 2x limit sebelumnya menunggu 24 jam.",
      "Kirim notifikasi email/SMS.",
    ],
    sla: "langsung / 24 jam cooling-off",
    exceptions: ["CIF update_required tidak boleh naik limit"],
  },
  {
    action: "biaya",
    title: (p) => `Informasi biaya dan bunga ${p}`,
    keywords: (p) => ["biaya", "admin", "bunga", "rate", p.toLowerCase()],
    summary: (p) =>
      `CS wajib merujuk board rate dan tabel biaya resmi ${p}. Jangan menjanjikan diskon di luar program.`,
    steps: (p) => [
      `Buka tabel biaya ${p} yang berlaku hari ini.`,
      "Sebutkan biaya admin, transfer, dan denda bila ada.",
      "Tawarkan simulasi bila relevan.",
    ],
    sla: "langsung",
    exceptions: ["Promo berlaku sesuai periode"],
  },
  {
    action: "blokir",
    title: (p) => `Blokir sementara fasilitas ${p}`,
    keywords: (p) => ["blokir", "freeze", "nonaktifkan", p.toLowerCase()],
    summary: (p) =>
      `Blokir sementara ${p} untuk mitigasi risiko. Unblokir membutuhkan otentikasi ulang.`,
    steps: (p) => [
      "Otentikasi nasabah.",
      `Tandai ${p} blocked.`,
      "Konfirmasi saluran yang terdampak.",
    ],
    sla: "< 5 menit",
    exceptions: ["Blokir hukum hanya oleh unit legal"],
  },
  {
    action: "unblokir",
    title: (p) => `Buka blokir ${p}`,
    keywords: (p) => ["buka blokir", "unblokir", "aktifkan lagi", p.toLowerCase()],
    summary: (p) =>
      `Unblokir ${p} setelah pastikan tidak ada hold fraud atau permintaan aparat.`,
    steps: (p) => [
      "Cek alasan blokir.",
      "Otentikasi kuat.",
      `Aktifkan kembali ${p}.`,
    ],
    sla: "15 menit bila bukan fraud",
    exceptions: ["Hold aparat / AML tidak boleh dibuka CS"],
  },
  {
    action: "statement",
    title: (p) => `Unduh rekening koran / statement ${p}`,
    keywords: (p) => ["rekening koran", "statement", "mutasi pdf", p.toLowerCase()],
    summary: (p) =>
      `Statement ${p} tersedia 10 tahun ke belakang sesuai retensi digital Bang Digital.`,
    steps: (p) => [
      "Pilih periode.",
      `Generate PDF ${p}.`,
      "Kirim ke email terdaftar atau unduh di aplikasi.",
    ],
    sla: "langsung untuk 12 bulan, 1 hari kerja untuk arsip > 1 tahun",
    exceptions: ["Periode > 10 tahun tidak tersedia"],
  },
  {
    action: "komplain",
    title: (p) => `Pengaduan terkait ${p}`,
    keywords: (p) => ["komplain", "pengaduan", "tidak puas", p.toLowerCase()],
    summary: (p) =>
      `Setiap keluhan ${p} wajib tiket dan klasifikasi. Jangan menyalahkan nasabah.`,
    steps: (p) => [
      "Dengarkan kronologi.",
      `Buat tiket kategori ${p}.`,
      "Berikan nomor tiket dan SLA.",
    ],
    sla: "ack 2 hari kerja, selesai 20 hari kerja",
    exceptions: ["Isu sistemik eskalasi operasional"],
  },
];

const CHANNEL_SETS = [
  ["Aplikasi Bang", "Live CS"],
  ["Aplikasi Bang", "Cabang"],
  ["Live CS", "Cabang", "Video Banking"],
];

function generatedVariants(): SopDocument[] {
  const docs: SopDocument[] = [];
  let i = 1;
  for (const product of PRODUCTS) {
    for (const action of ACTIONS) {
      const channels = CHANNEL_SETS[i % CHANNEL_SETS.length]!;
      docs.push({
        id: `SOP-PRD-${String(i).padStart(3, "0")}`,
        category: "Produk",
        title: action.title(product),
        keywords: action.keywords(product),
        summary: action.summary(product),
        steps: action.steps(product),
        sla: action.sla,
        channels,
        exceptions: action.exceptions,
        products: [product],
      });
      i += 1;
    }
  }
  return docs;
}

const EXTRA_TOPICS: Draft[] = [
  {
    category: "Aplikasi",
    title: "Aktivasi aplikasi Bang Digital pertama kali",
    keywords: ["aktivasi aplikasi", "daftar aplikasi", "onboarding"],
    summary: "Download resmi, verifikasi KTP, liveness, buat PIN, dan device binding.",
    steps: ["Unduh dari store resmi", "Scan KTP", "Liveness", "Buat PIN 6 digit", "Aktifkan notifikasi"],
    sla: "10 menit",
    channels: ["Aplikasi Bang"],
    exceptions: ["Perangkat di-root ditolak"],
    products: [],
  },
  {
    category: "Aplikasi",
    title: "Aplikasi error atau tidak bisa login",
    keywords: ["aplikasi error", "tidak bisa login", "force close", "maintenance"],
    summary: "Cek status insiden. Bila massal, informasikan ETA. Bila individu, reset sesi dan cache.",
    steps: ["Cek dashboard insiden", "Minta versi aplikasi", "Logout semua perangkat", "Update aplikasi"],
    sla: "15 menit untuk kasus individu",
    channels: ["Live CS"],
    exceptions: ["Insiden nasional: jangan reset data nasabah"],
    products: [],
  },
  {
    category: "Virtual Account",
    title: "Pembayaran virtual account Bang Digital",
    keywords: ["virtual account", "va", "bayar va"],
    summary: "VA bersifat closed-amount atau open-amount. Expired VA tidak boleh dipaksa settle manual oleh CS.",
    steps: ["Cek nomor VA dan nominal", "Konfirmasi status billing", "Minta nasabah bayar ulang bila expired"],
    sla: "settlement realtime atau T+1 billing",
    channels: ["Aplikasi Bang", "ATM"],
    exceptions: ["VA closed-amount harus exact"],
    products: ["BangGiro Usaha"],
  },
  {
    category: "E-wallet",
    title: "Top up e-wallet dari rekening Bang Digital",
    keywords: ["top up", "gopay", "ovo", "dana", "shopeepay"],
    summary: "Top up e-wallet realtime. Gagal debet harus refund otomatis.",
    steps: ["Pilih e-wallet", "Masukkan nomor HP tujuan", "OTP", "Cek status mitra"],
    sla: "realtime / refund 1x24 jam",
    channels: ["Aplikasi Bang"],
    exceptions: ["Nomor e-wallet belum KYC mitra"],
    products: ["BangTabungan Digital"],
  },
  {
    category: "Kartu Kredit",
    title: "Cicilan transaksi kartu kredit",
    keywords: ["cicilan", "convert installment", "bunga cicilan"],
    summary: "Transaksi di atas Rp 500.000 dapat dicicil 3/6/12 bulan sesuai program.",
    steps: ["Pilih transaksi", "Pilih tenor", "Konfirmasi bunga", "Tagihan terpecah di statement berikutnya"],
    sla: "berlaku statement berikutnya",
    channels: ["Aplikasi Bang", "Live CS"],
    exceptions: ["Transaksi tunai / cash advance tidak dapat dicicil"],
    products: ["BangKartu Gold", "BangKartu Platinum"],
  },
  {
    category: "Kartu Kredit",
    title: "Kenaikan limit kartu kredit",
    keywords: ["naik limit kartu", "limit cc"],
    summary: "Review otomatis 6 bulan sekali atau on-demand dengan slip gaji terbaru.",
    steps: ["Cek pembayaran 6 bulan", "Upload penghasilan", "Putusan scoring", "Notifikasi limit baru"],
    sla: "3 hari kerja",
    channels: ["Aplikasi Bang"],
    exceptions: ["Kartu late tidak eligible"],
    products: ["BangKartu Classic", "BangKartu Gold", "BangKartu Platinum"],
  },
  {
    category: "Pinjaman",
    title: "Restrukturisasi pinjaman",
    keywords: ["restruk", "keringanan", "perpanjang tenor"],
    summary: "Restruk untuk nasabah kesulitan bayar: perpanjang tenor atau turunkan angsuran. Wajib penghasilan terbaru.",
    steps: ["Isi form kesulitan", "Simulasi angsuran baru", "Akad addendum", "Jadwal baru aktif"],
    sla: "10 hari kerja",
    channels: ["Cabang"],
    exceptions: ["Sudah hapus buku tidak bisa restruk standar"],
    products: ["BangPinjam KTA", "BangKPR", "BangKKB"],
  },
  {
    category: "Wealth Management",
    title: "Switching reksa dana",
    keywords: ["switching", "pindah reksa", "alih instrumen"],
    summary: "Pindah antar fund BangInvest tanpa cair ke rekening, tetap kena spread NAV.",
    steps: ["Pilih fund sumber dan tujuan", "Cek profil risiko", "Order switch", "Settlement mengikuti fund tujuan"],
    sla: "T+2 sampai T+4",
    channels: ["Aplikasi Bang"],
    exceptions: ["Switch ke risiko lebih tinggi wajib konfirmasi"],
    products: ["BangInvest Pasar Uang", "BangInvest Pendapatan Tetap", "BangInvest Saham Nusantara"],
  },
  {
    category: "Kepatuhan",
    title: "Pelaporan transaksi mencurigakan ke unit AML",
    keywords: ["aml", "transaksi mencurigakan", "str", "cft"],
    summary: "CS tidak memberitahu nasabah bahwa mereka dilaporkan. Eskalasi diam-diam ke AML.",
    steps: ["Jangan tipping-off", "Catat indikator", "Eskalasi AML", "Lanjutkan pelayanan normal"],
    sla: "eskalasi hari yang sama",
    channels: ["Live CS"],
    exceptions: ["Jangan blokir sendiri tanpa instruksi AML kecuali fraud jelas"],
    products: [],
  },
  {
    category: "Cabang & Lokasi",
    title: "Informasi lokasi ATM dan kantor cabang",
    keywords: ["lokasi atm", "kantor cabang", "jam operasional", "cabang terdekat"],
    summary: "Berikan cabang dan ATM terdekat berdasarkan kota nasabah. Jam operasional cabang 08.00-15.00 WIB hari kerja.",
    steps: ["Minta kota/kecamatan", "Berikan 2-3 lokasi", "Sebut jam dan layanan (teller, safe deposit, prioritas)"],
    sla: "langsung",
    channels: ["Live CS", "Aplikasi Bang"],
    exceptions: ["Libur nasional cabang tutup, ATM tetap 24 jam"],
    products: [],
  },
];

const CITIES = [
  "Jakarta Selatan",
  "Jakarta Pusat",
  "Bandung",
  "Surabaya",
  "Medan",
  "Semarang",
  "Yogyakarta",
  "Makassar",
  "Depok",
  "Tangerang",
];

function locationSops(): SopDocument[] {
  return CITIES.map((city, idx) => ({
    id: `SOP-LOC-${String(idx + 1).padStart(3, "0")}`,
    category: "Cabang & Lokasi",
    title: `Lokasi layanan Bang Digital di ${city}`,
    keywords: ["lokasi", "atm", "cabang", city.toLowerCase()],
    summary: `Daftar layanan Bang Digital di ${city}: 1 KC, 1 KCP, dan jaringan ATM/CRM 24 jam.`,
    steps: [
      `KC Bang Digital ${city} buka hari kerja 08.00-15.00.`,
      `ATM 24 jam di mal dan area perkantoran ${city}.`,
      "Setoran CRM tersedia di KC.",
    ],
    sla: "langsung",
    channels: ["Live CS"],
    exceptions: ["Kunjungan prioritas wajib appointment"],
    products: [],
  }));
}

const FAQ_INTENTS = [
  ["ubah email", "Ganti email notifikasi", "Email baru wajib OTP. Email lama tetap dapat tembusan 7 hari."],
  ["ubah rekening utama", "Ganti rekening default", "Rekening utama dipakai QRIS, autodebet, dan investasi."],
  ["hold gaji", "Hold kredit masuk", "Hold maksimal 1x24 jam untuk screening AML nominal besar."],
  ["bukti potong pajak", "Unduh bukti potong bunga", "Bukti potong tersedia setiap Januari untuk tahun pajak sebelumnya."],
  ["standing instruction", "Atur transfer otomatis", "SI dapat dijadwalkan harian/mingguan/bulanan sebelum pukul 22.00."],
  ["kartu virtual", "Terbit kartu debit virtual", "Kartu virtual langsung aktif untuk e-commerce, fisik menyusul 3-5 hari."],
  ["tap to pay", "Aktifkan tap to pay", "NFC hanya di perangkat terikat dan Android/iOS yang didukung."],
  ["valas usd", "Informasi kurs USD", "Kurs counter digital diupdate hari kerja. Konversi memakai mid-rate + spread."],
  ["swift luar negeri", "Transfer SWIFT keluar", "SWIFT cut-off 11.00 WIB, butuh tujuan, SWIFT code, dan tujuan dana."],
  ["rekening anak", "Buka rekening anak", "Usia 0-17 wajib wali. Kartu debit anak berlimit rendah."],
  ["joint account", "Rekening gabungan", "Joint AND butuh persetujuan kedua pihak untuk tarik di atas threshold."],
  ["safe deposit", "Safe deposit box", "SDB tersedia di KC tertentu, sewa tahunan, akses dengan KTP + specimen."],
  ["payroll perusahaan", "Layanan payroll SME", "File payroll H-1 pukul 16.00, kredit karyawan H+0 pagi."],
  ["autodebet tagihan", "Daftar autodebit", "Autodebet PLN/BPJS/telco dapat dibatalkan H-1 sebelum tanggal tarik."],
  ["kartu rusak", "Ganti kartu rusak", "Kartu chip rusak diblokir dan diganti, nomor bisa sama atau baru."],
  ["cetak kartu fisik", "Minta kartu fisik", "Kartu fisik dikirim ekspedisi 3-7 hari kerja ke alamat CIF."],
  ["ubah tenor deposito", "Ubah tenor saat ARO", "Tenor baru berlaku pada perpanjangan berikutnya, bukan di tengah jalan."],
  ["gadai deposito", "Deposito sebagai agunan", "LTV deposito hingga 90% untuk KTA khusus, bilyet di-hold."],
  ["take over kpr", "Take over KPR dari bank lain", "Butuh sisa outstanding, appraisal ulang, dan roya bank asal."],
  ["asuransi kpr", "Klaim asuransi jiwa KPR", "Klaim meninggal dunia menutup sisa pokok sesuai polis."],
  ["denda keterlambatan kartu", "Denda late charge kartu", "Late charge dihitung jika minimum payment belum masuk di due date."],
  ["cashback kartu", "Cashback dan reward", "Cashback diposting H+3 setelah transaksi settle, tidak berlaku untuk tunai."],
  ["penutupan kartu kredit", "Tutup kartu kredit", "Kartu hanya bisa ditutup jika outstanding nol dan tidak ada cicilan."],
  ["naik kolektibilitas", "Turunkan kolektibilitas", "Bayar tunggakan + denda, update SLIK mengikuti periode pelaporan."],
  ["surat keterangan nasabah", "Minta SKN / keterangan rekening", "Surat keterangan cabang selesai 1 hari kerja, bermaterai atas permintaan."],
  ["blokir transaksi luar negeri", "Matikan transaksi luar negeri", "Flag internasional dapat dimatikan di aplikasi untuk cegah fraud."],
  ["chargeback atm bersama", "Dispute ATM bank lain", "Ikuti window ATM Bersama 7-14 hari, butuh journal ATM tujuan."],
  ["limit qris harian", "Limit QRIS per segmen", "Personal 10 juta, affluent 25 juta, priority 50 juta per hari."],
  ["biaya transfer bifast", "Biaya BI-FAST", "BI-FAST Rp 2.500 di bawah 250 juta, gratis untuk promo periode tertentu."],
  ["cut off rtgs", "Jam cut-off RTGS", "Order RTGS setelah 14.30 WIB diproses hari kerja berikutnya."],
  ["lupa user id", "Lupa user ID aplikasi", "User ID dikirim ke email terdaftar setelah otentikasi cabang atau video."],
  ["aktifkan notifikasi", "Notifikasi push dan email", "Nasabah dapat memilah notifikasi saldo, promo, dan keamanan."],
  ["ubah status menikah", "Update status pernikahan CIF", "Perlu akta nikah/cerai untuk perubahan status di CIF."],
  ["tambah ahli waris", "Pendaftaran ahli waris", "Ahli waris dicatat di CIF, eksekusi tetap butuh dokumen legal."],
  ["hold kartu ecom", "Matikan transaksi e-commerce", "Flag e-com dapat dimatikan sementara tanpa blokir kartu fisik."],
  ["3d secure", "OTP 3D Secure kartu", "Transaksi daring wajib 3DS. CS tidak meminta kode 3DS."],
  ["cicil emas", "Produk cicil emas", "Tidak tersedia. Arahkan ke tabungan rencana atau deposito."],
  ["rekening escrow", "Rekening escrow developer", "Escrow hanya untuk mitra developer terdaftar, akad terpisah."],
  ["setoran tunai crm", "Setor tunai CRM", "CRM menerima kelipatan Rp 50.000, kredit realtime ke rekening sendiri."],
  ["tarik tanpa kartu", "Tarik tunai tanpa kartu", "Generate kode QR ATM berlaku 5 menit, limit sama dengan kartu."],
  ["ubah alamat kirim kartu", "Alamat pengiriman kartu", "Alamat kirim kartu mengikuti CIF atau alamat khusus sekali kirim."],
  ["biaya admin bulanan", "Biaya admin rekening", "Admin tabungan Rp 11.000/3 bulan, giro Rp 25.000/3 bulan, bebas bila saldo rata-rata terpenuhi."],
  ["bunga tabungan", "Perhitungan bunga tabungan", "Bunga dihitung harian atas saldo penutupan, dikredit awal bulan."],
  ["dormant giro", "Giro tidak aktif", "Giro tanpa mutasi 12 bulan dormant dan tidak bisa outgoing sebelum aktivasi."],
  ["tutup giro usaha", "Penutupan BangGiro Usaha", "Wajib nihil cek/bilyet giro beredar dan tidak ada pending kliring."],
  ["pajak bunga deposito", "Pajak bunga deposito", "Bunga deposito dikenakan PPh sesuai ketentuan, kecuali yang dikecualikan."],
  ["aro deposito", "Perpanjangan otomatis deposito", "ARO memotong/menambah sesuai opsi pokok atau pokok+bunga."],
  ["agunan kkb", "BPKB sebagai agunan KKB", "BPKB disimpan bank sampai lunas, roya setelah surat lunas."],
  ["asuransi kkb", "Asuransi kendaraan KKB", "Wajib comprehensive tahun pertama, klaim melalui panel asuransi."],
  ["paylater limit", "Limit BangPaylater", "Limit dinamis dari mutasi 6 bulan dan skor internal."],
  ["batal paylater", "Pembatalan tagihan Paylater", "Hanya sebelum settle merchant, setelah itu jadi angsuran."],
  ["nav harian", "Cek NAV BangInvest", "NAV dipublikasikan hari bursa H+1 pagi di aplikasi."],
  ["risiko investasi", "Penjelasan risiko pasar", "Nilai investasi dapat turun. CS tidak menjanjikan imbal hasil."],
  ["pajak reksa dana", "Pajak penjualan reksa dana", "Keuntungan reksa dana mengikuti ketentuan pajak pasar modal berlaku."],
  ["klaim bancassurance", "Klaim BangProteksi", "Klaim ke perusahaan asuransi mitra, bank membantu kelengkapan."],
  ["ubah tenor kta", "Ubah tenor KTA berjalan", "Hanya melalui restruk, bukan menu aplikasi biasa."],
  ["denda kpr", "Denda keterlambatan KPR", "Denda harian atas angsuran tertunggak sesuai akad."],
  ["roya kpr", "Proses roya setelah lunas", "Roya 7-14 hari kerja setelah surat lunas terbit."],
  ["skl pinjaman", "Surat keterangan lunas", "SKL terbit 3 hari kerja setelah pelunasan efektif."],
  ["pelunasan kartu", "Lunas kartu kredit", "Pembayaran full outstanding + bunga berjalan sebelum tutup kartu."],
  ["chargeback timeout", "Batas waktu dispute", "Dispute > 60 hari dari statement ditolak kecuali fraud terbukti."],
] as const;

function faqSops(): SopDocument[] {
  return FAQ_INTENTS.map(([kw, title, summary], idx) => ({
    id: `SOP-FAQ-${String(idx + 1).padStart(3, "0")}`,
    category: "FAQ Operasional",
    title,
    keywords: [kw, ...kw.split(" ")],
    summary,
    steps: [
      "Otentikasi nasabah bila data bersifat personal.",
      `Jelaskan ketentuan: ${summary}`,
      "Catat tiket jika nasabah meminta eksekusi, bukan sekadar info.",
    ],
    sla: "langsung untuk informasi, 1-3 hari kerja untuk eksekusi",
    channels: ["Live CS", "Aplikasi Bang"],
    exceptions: ["Perubahan data legal hanya di cabang"],
    products: [],
  }));
}

let _catalog: SopDocument[] | null = null;

export function getSopCatalog(): SopDocument[] {
  if (_catalog) return _catalog;
  _catalog = [
    ...coreSops(),
    ...generatedVariants(),
    ...EXTRA_TOPICS.map((d, i) => sop("XTR", i + 1, d)),
    ...locationSops(),
    ...faqSops(),
    ...expandSops(),
  ];
  return _catalog;
}

export function sopCount(): number {
  return getSopCatalog().length;
}
