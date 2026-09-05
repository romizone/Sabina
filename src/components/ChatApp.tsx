"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatMeta } from "@/lib/types";

type CustomerOpt = {
  cif: string;
  name: string;
  city: string;
  segment: string;
};

type Bubble = {
  role: "user" | "assistant";
  content: string;
  imageDataUrl?: string;
};

const SUGGESTIONS = [
  "Saldo tabungan saya berapa?",
  "Kapan jatuh tempo deposito saya?",
  "Bunga deposito 12 bulan berapa?",
  "ATM terdekat di Jakarta Selatan",
  "Cari cabang Bang Digital di Surabaya",
  "Mutasi ATM 30 hari terakhir",
  "Tagihan kartu kredit bulan ini",
  "Mau buka kartu kredit, contact siapa?",
  "Kartu ATM saya ketelen",
  "Saya mau lapor transaksi fraud",
  "Kurs USD hari ini",
];

export function ChatApp() {
  const [customers, setCustomers] = useState<CustomerOpt[]>([]);
  const [cif, setCif] = useState("1001001000");
  const [sopCount, setSopCount] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Bubble[]>([
    {
      role: "assistant",
      content:
        "Hai, aku Sabina, live Customer Service Bang Digital. Saya punya akses data rekening, deposito, kartu, pinjaman, mutasi, lokasi ATM/cabang, bunga, dan SOP perbankan. Silakan tanya apa pun seputar layanan bank — atau unggah bukti transfer.",
    },
  ]);
  const [meta, setMeta] = useState<ChatMeta | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => customers.find((c) => c.cif === cif),
    [customers, cif],
  );

  useEffect(() => {
    void fetch("/api/customers")
      .then((r) => r.json())
      .then((data: { customers: CustomerOpt[]; sopCount: number }) => {
        setCustomers(data.customers);
        setSopCount(data.sopCount);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string, attach?: string) {
    const content = text.trim();
    if ((!content && !attach) || busy) return;
    const next: Bubble[] = [...messages, { role: "user", content, imageDataUrl: attach }];
    setMessages(next);
    setInput("");
    setImage(undefined);
    setBusy(true);
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cif, messages: next }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "" }));
        throw new Error(
          err.error ||
            "Maaf, saluran Live CS sempat terputus. Kirim ulang pertanyaan Anda ya.",
        );
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const ev = part.match(/^event: (\w+)/m)?.[1];
          const dataLine = part.split("\n").find((l) => l.startsWith("data:"));
          if (!ev || !dataLine) continue;
          const data = JSON.parse(dataLine.slice(5).trim()) as ChatMeta & { t?: string };
          if (ev === "meta") {
            setMeta({
              guardrail: Boolean(data.guardrail),
              model: "DeepRomeo",
              sops: data.sops ?? [],
              retrieved: data.retrieved,
              ragTotal: data.ragTotal,
              rangeLabel: data.rangeLabel,
              customerName: data.customerName,
              ticket: data.ticket,
            });
          }
          if (ev === "delta" && data.t) {
            acc += data.t;
            const snapshot = acc;
            setMessages((curr) => {
              const copy = [...curr];
              copy[copy.length - 1] = { role: "assistant", content: snapshot };
              return copy;
            });
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi gangguan.";
      setMessages((curr) => {
        const copy = [...curr];
        copy[copy.length - 1] = { role: "assistant", content: message };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  }

  function onPickFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 4_500_000) {
      alert("Gambar maksimal 4,5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[260px_minmax(0,1fr)_280px]">
      <aside className="border border-[#e4e8ee] bg-white p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0b3d91]">
          Nasabah demo
        </p>
        <div className="mt-3 space-y-1.5">
          {customers.map((c) => (
            <button
              key={c.cif}
              type="button"
              onClick={() => setCif(c.cif)}
              className={`w-full border px-3 py-2 text-left ${
                cif === c.cif
                  ? "border-[#0b3d91] bg-[#eef3fb]"
                  : "border-[#e4e8ee] bg-white"
              }`}
            >
              <span className="block text-sm font-semibold text-[#1a1d23]">{c.name}</span>
              <span className="block text-[11px] text-[#5c6570]">
                CIF {c.cif} · {c.city}
              </span>
            </button>
          ))}
        </div>
        {selected ? (
          <p className="mt-4 text-[11px] leading-5 text-[#5c6570]">
            Segmen {selected.segment}. Transaksi dihitung otomatis dari hari ini
            mundur 10 tahun.
          </p>
        ) : null}
      </aside>

      <section className="flex min-h-[72vh] flex-col border border-[#e4e8ee] bg-white">
        <div className="flex items-center gap-3 border-b border-[#e4e8ee] px-4 py-3">
          <Image
            src="/images/sabina-avatar.png"
            alt="Sabina"
            width={44}
            height={44}
            className="h-11 w-11 rounded-full object-cover"
          />
          <div>
            <p className="text-sm font-bold text-[#1a1d23]">Sabina</p>
            <p className="text-[11px] text-[#5c6570]">
              Live CS Bang Digital · DeepRomeo
            </p>
          </div>
        </div>

        <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {messages.map((m, i) => (
            <div
              key={`${m.role}-${i}`}
              className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" ? (
                <Image
                  src="/images/sabina-avatar.png"
                  alt=""
                  width={28}
                  height={28}
                  className="mt-1 h-7 w-7 rounded-full object-cover"
                />
              ) : null}
              <div
                className={`max-w-[80%] px-3 py-2 text-sm leading-6 ${
                  m.role === "user"
                    ? "bg-[#0b3d91] text-white"
                    : "bg-[#f4f6f8] text-[#1a1d23]"
                }`}
              >
                {m.imageDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.imageDataUrl} alt="Lampiran" className="mb-2 max-h-40" />
                ) : null}
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-[#e4e8ee] px-4 py-3">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void send(s)}
                className="border border-[#e4e8ee] px-2 py-1 text-[11px] text-[#5c6570] hover:border-[#0b3d91] hover:text-[#0b3d91]"
              >
                {s}
              </button>
            ))}
          </div>
          {image ? (
            <div className="mb-2 flex items-center gap-2 text-[11px] text-[#5c6570]">
              Lampiran siap dikirim
              <button type="button" onClick={() => setImage(undefined)} className="underline">
                hapus
              </button>
            </div>
          ) : null}
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input, image);
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => onPickFile(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="border border-[#e4e8ee] px-3 py-2 text-xs text-[#5c6570]"
            >
              Foto
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={2}
              placeholder="Tulis pertanyaan perbankan..."
              className="min-h-[44px] flex-1 resize-none border border-[#e4e8ee] px-3 py-2 text-sm outline-none focus:border-[#0b3d91]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input, image);
                }
              }}
            />
            <button
              type="submit"
              disabled={busy}
              className="bg-[#0b3d91] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Kirim
            </button>
          </form>
        </div>
      </section>

      <aside className="border border-[#e4e8ee] bg-white p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0b3d91]">
          Konteks Sabina
        </p>
        <dl className="mt-3 space-y-2 text-[12px] text-[#5c6570]">
          <div>
            <dt className="font-semibold text-[#1a1d23]">Model</dt>
            <dd>DeepRomeo</dd>
          </div>
          <div>
            <dt className="font-semibold text-[#1a1d23]">SOP + layanan</dt>
            <dd>
              {sopCount ?? "…"} SOP
              {meta?.ragTotal ? ` · RAG ${meta.ragTotal} dokumen` : ""}
            </dd>
          </div>
          {meta?.rangeLabel ? (
            <div>
              <dt className="font-semibold text-[#1a1d23]">Rentang mutasi</dt>
              <dd>{meta.rangeLabel}</dd>
            </div>
          ) : null}
          <div>
            <dt className="font-semibold text-[#1a1d23]">Guardrail</dt>
            <dd>{meta?.guardrail ? "Menolak topik non-bank" : "Topik perbankan"}</dd>
          </div>
        </dl>
        {meta?.ticket ? (
          <div className="mt-4 border border-[#0b3d91] bg-[#eef3fb] px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0b3d91]">
              Tiket pengaduan
            </p>
            <p className="mt-1 text-sm font-bold text-[#1a1d23]">{meta.ticket.id}</p>
            <p className="text-[11px] text-[#5c6570]">
              {meta.ticket.title} · {meta.ticket.priority} · {meta.ticket.status}
            </p>
            <p className="text-[11px] text-[#5c6570]">
              {meta.ticket.unit} · SLA {meta.ticket.sla}
            </p>
          </div>
        ) : null}
        {meta?.sops?.length ? (
          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0b3d91]">
              SOP terambil
            </p>
            <ul className="mt-2 space-y-2">
              {meta.sops.map((s) => (
                <li key={s.id} className="border border-[#e4e8ee] px-2 py-2">
                  <p className="text-[11px] font-semibold text-[#1a1d23]">
                    {s.id} · {s.title}
                  </p>
                  <p className="mt-1 text-[11px] text-[#5c6570]">{s.sla}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </aside>
    </main>
  );
}
