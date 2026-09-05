import Link from "next/link";

const NAV = [
  "Individu",
  "UMKM",
  "Korporasi",
  "Wealth Management",
  "Digital Banking",
  "Tentang Bang Digital",
];

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="border-b border-[#e4e8ee] bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-2 text-[11px] text-[#6b7380]">
        <div className="flex gap-5">
          <span>Promosi</span>
          <span>Simulasi</span>
          <span>Lokasi</span>
          <span>Bantuan</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-sm bg-[#0b3d91] px-1.5 py-0.5 text-[10px] font-semibold text-white">
            ID
          </span>
          <span>EN</span>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-sm bg-[#0b3d91] text-sm font-bold text-white">
            B
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-bold tracking-[0.14em] text-[#0b3d91]">
              BANG
            </span>
            <span className="block text-[10px] font-semibold tracking-[0.22em] text-[#5c6570]">
              DIGITAL
            </span>
          </span>
        </Link>
        {!compact ? (
          <nav className="hidden items-center gap-6 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#1a1d23] lg:flex">
            {NAV.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </nav>
        ) : (
          <Link
            href="/chat"
            className="rounded-sm bg-[#0b3d91] px-4 py-2 text-xs font-semibold tracking-wide text-white"
          >
            CHAT SABINA
          </Link>
        )}
      </div>
    </header>
  );
}
