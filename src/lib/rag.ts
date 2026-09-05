import { CUSTOMERS } from "./data/customers";
import { now } from "./dates";
import { customerRagDocuments } from "./rag/customer-docs";
import {
  buildIndex,
  searchIndex,
  type RagDocument,
  type RagIndex,
  type RetrievedChunk,
} from "./rag/engine";
import { serviceRagDocuments } from "./rag/service-docs";
import { getSopCatalog, sopCount } from "./sop/catalog";
import type { RetrievedSop } from "./types";

export type { RagDocument, RetrievedChunk };

function sopToDoc(sop: {
  id: string;
  category: string;
  title: string;
  keywords: string[];
  summary: string;
  steps: string[];
  sla: string;
  channels: string[];
  exceptions: string[];
  products: string[];
}): RagDocument {
  return {
    id: sop.id,
    kind: "sop",
    title: sop.title,
    category: sop.category,
    keywords: sop.keywords,
    sla: sop.sla,
    text: [
      sop.summary,
      `Langkah: ${sop.steps.join(" | ")}`,
      `SLA: ${sop.sla}`,
      `Kanal: ${sop.channels.join(", ")}`,
      sop.exceptions.length ? `Pengecualian: ${sop.exceptions.join("; ")}` : "",
      sop.products.length ? `Produk: ${sop.products.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

function toChunk(doc: RagDocument, score: number): RetrievedChunk {
  return {
    id: doc.id,
    kind: doc.kind,
    title: doc.title,
    category: doc.category,
    score,
    text: doc.text,
    sla: doc.sla,
  };
}

let sopIndex: RagIndex | null = null;
let serviceIndex: RagIndex | null = null;
const dataIndexCache = new Map<string, RagIndex>();

export function getSopIndex(): RagIndex {
  if (!sopIndex) sopIndex = buildIndex(getSopCatalog().map(sopToDoc));
  return sopIndex;
}

export function getServiceIndex(): RagIndex {
  if (!serviceIndex) serviceIndex = buildIndex(serviceRagDocuments());
  return serviceIndex;
}

export function getCustomerIndex(cif: string, clock = now()): RagIndex {
  const key = `${cif}:${clock.toISOString().slice(0, 10)}`;
  const hit = dataIndexCache.get(key);
  if (hit) return hit;
  const profile = CUSTOMERS.find((c) => c.cif.cif === cif);
  const index = buildIndex(profile ? customerRagDocuments(profile, clock) : []);
  dataIndexCache.set(key, index);
  return index;
}

export function ragStats(cif?: string) {
  const sop = getSopIndex().docs.length;
  const service = getServiceIndex().docs.length;
  const data = cif ? getCustomerIndex(cif).docs.length : 0;
  return {
    sop,
    service,
    data,
    totalIndexed: sop + service + data,
  };
}

export function retrieveRag(
  query: string,
  opts?: { cif?: string },
): {
  sops: RetrievedSop[];
  data: RetrievedChunk[];
  retrieved: RetrievedChunk[];
  stats: ReturnType<typeof ragStats>;
} {
  const q = query.trim() || "layanan nasabah rekening transaksi kartu pinjaman deposito atm cabang";
  const sopHits = searchIndex(getSopIndex(), q, { k: 8, kinds: ["sop"], minScore: 0.15 });
  const serviceHits = searchIndex(getServiceIndex(), q, { k: 8, minScore: 0.15 });
  const dataHits = opts?.cif
    ? searchIndex(getCustomerIndex(opts.cif), q, { k: 12, cif: opts.cif, minScore: 0.08 })
    : [];

  if (opts?.cif) {
    const pinned = getCustomerIndex(opts.cif).docs.filter((d) =>
      ["cif", "savings", "loan", "card", "wealth"].includes(d.kind),
    );
    for (const doc of pinned) {
      if (!dataHits.some((h) => h.id === doc.id)) {
        dataHits.unshift(toChunk(doc, 98));
      }
    }
  }

  const sops: RetrievedSop[] = sopHits.map((h) => ({
    id: h.id,
    title: h.title,
    category: h.category,
    score: h.score,
    summary: h.text.split("\n")[0] ?? h.title,
    steps: h.text
      .split("\n")
      .filter((l) => l.startsWith("Langkah:"))
      .flatMap((l) => l.replace("Langkah: ", "").split(" | ")),
    sla: h.sla ?? "",
  }));

  return {
    sops,
    data: dataHits,
    retrieved: [...dataHits, ...serviceHits, ...sopHits],
    stats: ragStats(opts?.cif),
  };
}

export function formatRetrieved(chunks: RetrievedChunk[]): string {
  if (!chunks.length) {
    return "Tidak ada chunk RAG tambahan. Tetap pakai snapshot nasabah dan papan layanan.";
  }
  return chunks
    .map(
      (c, i) =>
        `${i + 1}. [${c.id}] (${c.kind}, ${c.category}, skor ${c.score}) ${c.title}\n${c.text}`,
    )
    .join("\n\n---\n\n");
}

export function retrieveSops(query: string, k = 5): RetrievedSop[] {
  return retrieveRag(query).sops.slice(0, k);
}

export function formatSops(sops: RetrievedSop[]): string {
  if (!sops.length) return "Tidak ada SOP relevan.";
  return sops
    .map((s, i) => `${i + 1}. [${s.id}] ${s.title} (${s.category})\n${s.summary}\nSLA: ${s.sla}`)
    .join("\n\n");
}

export { sopCount };
