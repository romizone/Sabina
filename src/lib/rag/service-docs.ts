import { allOutlets } from "../services/locations";
import { formatRateBoard, rateBoard } from "../services/rates";
import type { RagDocument } from "./engine";

export function serviceRagDocuments(): RagDocument[] {
  const board = rateBoard();
  const docs: RagDocument[] = [];

  for (const o of allOutlets()) {
    docs.push({
      id: `LOC-${o.id}`,
      kind: "location",
      title: o.name,
      category: o.kind === "atm" || o.kind === "crm" ? "Lokasi ATM" : "Lokasi Cabang",
      keywords: [
        o.kind,
        o.city.toLowerCase(),
        o.name.toLowerCase(),
        "lokasi",
        "terdekat",
        "atm",
        "cabang",
        "kantor",
        "bank",
        "crm",
      ],
      text: `${o.name} (${o.kind.toUpperCase()})\nAlamat: ${o.address}\nKota: ${o.city}\nJam: ${o.hours}\nLayanan: ${o.services.join(", ")}`,
    });
  }

  docs.push({
    id: "SVC-RATE-BOARD",
    kind: "service",
    title: `Papan bunga dan tarif Bang Digital ${board.effective}`,
    category: "Rate & Tarif",
    keywords: [
      "bunga",
      "deposito",
      "rate",
      "tarif",
      "biaya",
      "limit",
      "kurs",
      "lps",
      "promo",
    ],
    text: formatRateBoard(),
  });

  for (const d of board.deposits) {
    docs.push({
      id: `SVC-DEP-${d.tenor.replace(/\s+/g, "")}`,
      kind: "service",
      title: `Bunga deposito ${d.tenor}`,
      category: "Deposito",
      keywords: ["bunga deposito", "deposito", d.tenor, "suku bunga", "rate"],
      text: `BangDeposito tenor ${d.tenor}: ${d.rate}, minimum penempatan ${d.min}. ARO tersedia. Break sebelum jatuh tempo kena penalti bunga. Berlaku ${board.effective}.`,
    });
  }

  docs.push({
    id: "SVC-FX",
    kind: "service",
    title: "Kurs valas Bang Digital",
    category: "Kurs",
    keywords: ["kurs", "valas", "usd", "dollar", "sgd", "eur", "jpy"],
    text: board.fx.map((f) => `${f.pair} beli ${f.buy} jual ${f.sell}`).join("\n"),
  });

  docs.push({
    id: "SVC-HOURS",
    kind: "service",
    title: "Jam operasional Bang Digital",
    category: "Jam Layanan",
    keywords: ["jam", "operasional", "buka", "cabang", "atm"],
    text: board.hours,
  });

  docs.push({
    id: "SVC-LPS",
    kind: "service",
    title: "Penjaminan LPS",
    category: "Kepatuhan",
    keywords: ["lps", "penjaminan", "2 miliar"],
    text: board.lps,
  });

  docs.push({
    id: "SVC-CONTACT",
    kind: "service",
    title: "Kontak Customer Service",
    category: "Kontak",
    keywords: ["kontak", "call center", "hubungi", "cs"],
    text: board.contact,
  });

  docs.push({
    id: "SVC-PROMO",
    kind: "service",
    title: "Promo berjalan Bang Digital",
    category: "Promo",
    keywords: ["promo", "cashback", "diskon"],
    text: board.promo.join("\n"),
  });

  return docs;
}
