"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const UTILITY = [
  { label: "Promo", href: "/chat" },
  { label: "Simulasi", href: "/chat" },
  { label: "ATM & Cabang", href: "/chat" },
  { label: "Bantuan", href: "/chat" },
];

const NAV = [
  { label: "Individu", href: "/chat" },
  { label: "UMKM", href: "/chat" },
  { label: "Korporasi", href: "/chat" },
  { label: "Wealth", href: "/chat" },
  { label: "Digital Banking", href: "/chat" },
];

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"ID" | "EN">("ID");

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-[linear-gradient(90deg,#052255_0%,#0b3d91_55%,#0a4cb5_100%)] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-1.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5 text-[11px] font-medium tracking-wide text-white/85">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2 py-0.5 ring-1 ring-white/15">
              <span className="live-dot" aria-hidden />
              Live CS 24/7
            </span>
            <span className="hidden truncate sm:inline">
              Saluran resmi · 1500-BANG
            </span>
            <span className="hidden truncate md:inline">
              · Enkripsi sesi aktif
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-white/80">
            {UTILITY.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="hidden transition hover:text-white sm:inline"
              >
                {item.label}
              </Link>
            ))}
            <div
              className="flex overflow-hidden rounded-full bg-white/10 p-0.5 ring-1 ring-white/15"
              role="group"
              aria-label="Bahasa"
            >
              {(["ID", "EN"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    lang === code
                      ? "bg-white text-[#0b3d91]"
                      : "text-white/75 hover:text-white"
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-[#dce3ee] bg-white/92 shadow-[0_8px_24px_rgba(11,61,145,0.06)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:px-5">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[linear-gradient(160deg,#0b3d91,#0a4cb5)] text-[15px] font-bold text-white shadow-[0_6px_16px_rgba(11,61,145,0.28)]">
              B
            </span>
            <span className="leading-tight">
              <span className="block text-[15px] font-bold tracking-[0.16em] text-[#0b3d91]">
                BANG
              </span>
              <span className="block text-[10px] font-semibold tracking-[0.24em] text-[#5c6570]">
                DIGITAL
              </span>
            </span>
          </Link>

          {compact ? (
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <div className="relative shrink-0">
                  <Image
                    src="/images/sabina-avatar.png"
                    alt=""
                    width={40}
                    height={40}
                    className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-[0_0_0_1px_#d6deea] sm:h-10 sm:w-10"
                  />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#16a34a] ring-2 ring-white" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-[#1a1d23]">
                    Chat Sabina
                  </p>
                  <p className="truncate text-[11px] text-[#5c6570]">
                    <span className="sm:hidden">Live CS · Online</span>
                    <span className="hidden sm:inline">
                      Live Customer Service · DeepRomeo
                    </span>
                  </p>
                </div>
              </div>
              <div className="hidden items-center gap-2 lg:flex">
                <span className="rounded-full bg-[#eef4ff] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#0b3d91]">
                  Aman
                </span>
                <span className="rounded-full bg-[#f1f5f9] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#475569]">
                  Prioritas
                </span>
              </div>
            </div>
          ) : (
            <>
              <nav className="hidden items-center gap-6 text-[12px] font-semibold text-[#1a1d23] lg:flex">
                {NAV.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="relative py-1 transition hover:text-[#0b3d91] after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:origin-left after:scale-x-0 after:bg-[#0b3d91] after:transition after:content-[''] hover:after:scale-x-100"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="flex items-center gap-2">
                <Link
                  href="/chat"
                  className="inline-flex items-center gap-2 rounded-full bg-[#0b3d91] px-4 py-2 text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(11,61,145,0.22)] transition hover:bg-[#072c6b]"
                >
                  <span className="live-dot live-dot-on-navy" aria-hidden />
                  Chat Sabina
                </Link>
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-full border border-[#e4e8ee] text-[#0b3d91] lg:hidden"
                  aria-expanded={open}
                  aria-label="Buka menu"
                  onClick={() => setOpen((v) => !v)}
                >
                  <span className="text-lg leading-none">{open ? "×" : "☰"}</span>
                </button>
              </div>
            </>
          )}
        </div>

        {!compact && open ? (
          <nav className="border-t border-[#e4e8ee] bg-white px-4 py-3 lg:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-[#1a1d23] hover:bg-[#eef3fb]"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
