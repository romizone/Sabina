import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

const HELPS = [
  {
    title: "Promo",
    body: "Dapatkan info promo merchant Bang Digital terbaru",
  },
  {
    title: "Info kurs",
    body: "Dapatkan info kurs terkini",
  },
  {
    title: "Lokasi ATM & cabang",
    body: "Dapatkan info lokasi ATM dan unit kerja terdekat",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <section className="hero-wash relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-end px-5 pt-8 md:grid-cols-[1fr_1.05fr]">
          <div className="pb-16 pt-10">
            <p className="wordmark-ghost text-[72px] font-semibold leading-none md:text-[120px]">
              Sabina
            </p>
          </div>
          <div className="relative mx-auto h-[320px] w-full max-w-[460px] md:h-[420px]">
            <Image
              src="/images/sabina-hero.png"
              alt="Sabina, Customer Service Bang Digital"
              fill
              priority
              className="object-contain object-bottom"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0b3d91]">
            Tanya Sabina
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-[#1a1d23] md:text-[40px]">
            Bagaimana Sabina
            <br />
            Bisa Membantu Anda?
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-7 text-[#5c6570]">
            Hai, aku Sabina, live Customer Service Bang Digital. Aku punya akses
            data existing nasabah — CIF, saldo, mutasi, deposito, kartu,
            pinjaman, investasi — plus lokasi ATM/cabang, bunga, kurs, dan
            ribuan SOP perbankan. Aku juga bisa menerbitkan tiket pengaduan
            dan membaca bukti transfer lewat DeepRomeo.
          </p>
          <p className="mt-4 text-[15px] leading-7 text-[#5c6570]">
            Pilih nasabah demo, lalu mulai percakapan. Pertanyaan di luar
            perbankan akan ditolak guardrail.
          </p>
          <Link
            href="/chat"
            className="mt-8 inline-flex items-center rounded-sm bg-[#0b3d91] px-6 py-3 text-sm font-semibold tracking-wide text-white hover:bg-[#072c6b]"
          >
            CHAT SABINA
          </Link>
        </div>
        <div className="relative mx-auto h-[360px] w-full max-w-[340px]">
          <Image
            src="/images/sabina-greet.png"
            alt="Sabina menyapa nasabah"
            fill
            className="object-contain object-bottom"
          />
        </div>
      </section>

      <section className="border-t border-[#e4e8ee] bg-[#f7f8fa] py-12">
        <div className="mx-auto grid max-w-6xl gap-4 px-5 md:grid-cols-3">
          {HELPS.map((item) => (
            <Link
              key={item.title}
              href="/chat"
              className="border border-[#e4e8ee] bg-white p-6"
            >
              <p className="text-lg font-bold text-[#1a1d23]">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-[#5c6570]">{item.body}</p>
              <p className="mt-6 text-sm font-semibold text-[#0b3d91]">Sabina ›</p>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#e4e8ee] bg-white py-8 text-center text-[11px] text-[#6b7380]">
        <p>PT Bank Digital Bang Digital (fiksi) · sabina.rominur.com</p>
        <p className="mt-1">
          Disimulasikan sebagai bank berizin. Data nasabah bersifat mockup.
        </p>
      </footer>
    </div>
  );
}
