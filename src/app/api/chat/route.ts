import { PUBLIC_MODEL_NAME } from "@/lib/config";
import { findCustomer, getCustomer } from "@/lib/data/customers";
import { buildCustomerContext, wantsMutasi } from "@/lib/data/snapshot";
import { classifyGuard, refusalText } from "@/lib/guardrail";
import { formatRetrieved, retrieveRag } from "@/lib/rag";
import { buildServiceContext } from "@/lib/services/capabilities";
import { hasDeepseekKey, streamDeepseek, type LlmMessage } from "@/lib/deepseek";
import { fallbackAnswer, systemPrompt } from "@/lib/prompt";
import { sopCount } from "@/lib/sop/catalog";
import {
  createTicket,
  findTicket,
  formatTicket,
  listTickets,
  ticketLookupId,
} from "@/lib/tickets";
import type { ChatMessage, ChatMeta } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Incoming = {
  cif?: string;
  messages: ChatMessage[];
};

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function friendlyStream(text: string, extra?: Partial<ChatMeta>) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          sse("meta", {
            guardrail: false,
            model: PUBLIC_MODEL_NAME,
            sops: [],
            ...extra,
          }),
        ),
      );
      controller.enqueue(encoder.encode(sse("delta", { t: text })));
      controller.enqueue(encoder.encode(sse("done", {})));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

export async function POST(req: Request) {
  let body: Incoming;
  try {
    body = (await req.json()) as Incoming;
  } catch {
    return Response.json({ error: "Body tidak valid" }, { status: 400 });
  }

  try {
    return await handleChat(body);
  } catch (error) {
    console.error("chat POST", error);
    return friendlyStream(
      "Maaf, sistem sempat terganggu. Silakan kirim ulang pertanyaan perbankan Anda — saya tetap bisa bantu rekening, kartu, pinjaman, dan prosedur bank.",
    );
  }
}

async function handleChat(body: Incoming) {
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const last = [...messages].reverse().find((m) => m.role === "user");
  const userText = last?.content?.trim() ?? "";
  const image = last?.imageDataUrl;
  const hasImage = Boolean(image);

  if (!userText && !hasImage) {
    return Response.json({ error: "Pesan kosong" }, { status: 400 });
  }

  const decision = classifyGuard(userText, hasImage);
  const profile =
    (body.cif ? getCustomer(body.cif) : undefined) ??
    (userText ? findCustomer(userText) : undefined);

  const lookupId = ticketLookupId(userText);
  let lookedUp: ReturnType<typeof findTicket>;
  let opened: ReturnType<typeof createTicket> = null;
  let openTickets: ReturnType<typeof listTickets> = [];
  try {
    lookedUp = lookupId ? findTicket(lookupId) : undefined;
    opened =
      decision === "refuse" || lookedUp
        ? null
        : createTicket({ profile, cif: body.cif, message: userText, hasImage });
    openTickets = profile ? listTickets(profile.cif.cif).slice(0, 5) : [];
  } catch (error) {
    console.error("ticket store", error);
    lookedUp = undefined;
  }
  const ticket = opened ?? lookedUp;

  const rag =
    decision === "refuse"
      ? { sops: [], retrieved: [], stats: { sop: sopCount(), data: 0, totalIndexed: sopCount() } }
      : retrieveRag(userText || "pengaduan layanan nasabah", { cif: profile?.cif.cif });

  const customerCtx = profile
    ? buildCustomerContext(profile, userText || "saldo mutasi")
    : null;

  const meta: ChatMeta = {
    guardrail: decision === "refuse",
    model: PUBLIC_MODEL_NAME,
    sops: rag.sops,
    retrieved: rag.retrieved.map((c) => ({
      id: c.id,
      kind: c.kind,
      title: c.title,
      score: c.score,
    })),
    ragTotal: rag.stats.totalIndexed,
    rangeLabel: customerCtx?.rangeLabel,
    customerName: profile?.cif.name,
    ticket: ticket
      ? {
          id: ticket.id,
          title: ticket.title,
          category: ticket.category,
          priority: ticket.priority,
          status: ticket.status,
          sla: ticket.sla,
          unit: ticket.unit,
        }
      : undefined,
  };

  const encoder = new TextEncoder();

  if (decision === "refuse") {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(sse("meta", { ...meta, sopCorpus: rag.stats.sop })));
        controller.enqueue(encoder.encode(sse("delta", { t: refusalText(userText) })));
        controller.enqueue(encoder.encode(sse("done", {})));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  }

  const history = messages.slice(-8).map((m) => {
    if (m.role === "user" && m.imageDataUrl) {
      return {
        role: "user" as const,
        content: [
          { type: "text" as const, text: m.content || "Tolong cek lampiran ini untuk keperluan layanan bank." },
          { type: "image_url" as const, image_url: { url: m.imageDataUrl, detail: "original" as const } },
        ],
      };
    }
    return { role: m.role, content: m.content };
  });

  const ticketBlock = ticket
    ? [
        opened ? "=== TIKET BARU DITERBITKAN ===" : "=== TIKET DITEMUKAN ===",
        formatTicket(ticket),
        "WAJIB sebutkan nomor tiket ini kepada nasabah.",
      ].join("\n")
    : openTickets.length
      ? `Tiket terbuka nasabah:\n${openTickets.map((t) => `${t.id} · ${t.title} · ${t.status}`).join("\n")}`
      : "Tidak ada tiket baru pada pesan ini.";

  const serviceCtx = buildServiceContext(userText, profile);

  const grounded = [
    `Nasabah sesi: ${profile ? `${profile.cif.name} (CIF ${profile.cif.cif})` : "belum teridentifikasi."}`,
    "Anda memiliki akses penuh ke snapshot core, papan layanan, lokasi, dan SOP RAG di bawah ini.",
    customerCtx ? customerCtx.text : "Tidak ada CIF terpilih.",
    serviceCtx,
    wantsMutasi(userText)
      ? "Nasabah menanyakan mutasi/transaksi. Gunakan data RAG dan cuplikan mutasi."
      : "",
    ticketBlock,
    "=== RAG TERAMBIL (nasabah + lokasi/rate + SOP) ===",
    formatRetrieved(rag.retrieved),
  ]
    .filter(Boolean)
    .join("\n\n");

  const llmMessages: LlmMessage[] = [
    { role: "system", content: systemPrompt(new Date().toISOString()) },
    { role: "system", content: grounded },
    ...history,
  ];

  if (!hasDeepseekKey()) {
    const text = ticket
      ? `Baik${profile ? ` ${profile.cif.name}` : ""}, pengaduan Anda sudah saya catat.\n\nNomor tiket: ${ticket.id}\n${ticket.title}\nUnit: ${ticket.unit}\nPrioritas: ${ticket.priority}\nSLA: ${ticket.sla}\nStatus: ${ticket.status}\n\nTindakan: ${ticket.actions.join("; ")}.\n\nSimpan nomor tiket ini untuk follow-up. Saya tidak pernah meminta PIN, OTP, atau CVV.`
      : fallbackAnswer({
          userText,
          customerName: profile?.cif.name,
          context: customerCtx?.text ?? "Nasabah belum memilih CIF demo.",
          sopText: rag.sops.map((s) => `[${s.id}] ${s.title}`).join("\n"),
        });
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(sse("meta", { ...meta, model: "sabina-grounded-fallback", sopCorpus: rag.stats.sop })),
        );
        controller.enqueue(encoder.encode(sse("delta", { t: text })));
        controller.enqueue(encoder.encode(sse("done", {})));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  }

  try {
    const upstream = await streamDeepseek(llmMessages);
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(sse("meta", { ...meta, sopCorpus: rag.stats.sop })));
        const reader = upstream.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const chunks = buffer.split("\n");
            buffer = chunks.pop() ?? "";
            for (const line of chunks) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const payload = trimmed.slice(5).trim();
              if (payload === "[DONE]") continue;
              try {
                const json = JSON.parse(payload) as {
                  choices?: { delta?: { content?: string; reasoning_content?: string } }[];
                };
                const token = json.choices?.[0]?.delta?.content;
                if (token) {
                  controller.enqueue(encoder.encode(sse("delta", { t: token })));
                }
              } catch {
                // ignore partial json
              }
            }
          }
        } finally {
          controller.enqueue(encoder.encode(sse("done", {})));
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("deepromeo", error);
    return friendlyStream(
      "Maaf, saluran Live CS sempat terputus. Kirim ulang saja pertanyaannya — untuk kartu kredit bisa lewat chat ini, aplikasi Bang Digital, call center 1500-BANG, atau cabang terdekat.",
    );
  }
}
