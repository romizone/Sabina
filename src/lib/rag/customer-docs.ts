import { formatIdDate, formatIdDateTime, now } from "../dates";
import { formatIdr } from "../money";
import type { BankTransaction, CustomerProfile } from "../types";
import { describeDeposit } from "../data/deposit";
import { installment } from "../data/loan-math";
import { currentBalance, transactionsFor, wealthMarketValue } from "../data/transactions";
import type { RagDocument } from "./engine";

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(date);
}

function txLine(tx: BankTransaction): string {
  const signed = tx.credit > 0 ? `+${formatIdr(tx.credit)}` : `-${formatIdr(tx.debit)}`;
  return `${formatIdDateTime(new Date(tx.bookedAt))} | ${tx.accountNo} | ${tx.type} | ${tx.description} | ${signed} | saldo ${formatIdr(tx.balanceAfter)} | ${tx.status} | ref ${tx.reference}`;
}

export function customerRagDocuments(profile: CustomerProfile, clock = now()): RagDocument[] {
  const rows = transactionsFor(profile, clock);
  const docs: RagDocument[] = [];
  const cif = profile.cif.cif;
  const name = profile.cif.name;

  docs.push({
    id: `DATA-CIF-${cif}`,
    kind: "cif",
    title: `CIF ${name}`,
    category: "CIF Nasabah",
    cif,
    keywords: [
      "cif",
      "nasabah",
      "kyc",
      name.toLowerCase(),
      cif,
      profile.cif.phone,
      profile.cif.city.toLowerCase(),
      profile.cif.segment,
    ],
    text: [
      `Nama: ${name}`,
      `CIF: ${cif}`,
      `Lahir: ${profile.cif.dob} di ${profile.cif.pob}`,
      `NIK: ${profile.cif.nikMasked} | NPWP: ${profile.cif.npwpMasked}`,
      `Alamat: ${profile.cif.address}, ${profile.cif.city}`,
      `HP: ${profile.cif.phone} | Email: ${profile.cif.email}`,
      `Segmen: ${profile.cif.segment} | KYC: ${profile.cif.kycStatus} | Risiko: ${profile.cif.riskRating}`,
      `Nasabah sejak: ${profile.cif.openedOn} | Cabang: ${profile.cif.branch}`,
      `Pekerjaan: ${profile.cif.occupation} | Ibu kandung: ${profile.cif.motherMaiden}`,
    ].join("\n"),
  });

  for (const account of profile.savings) {
    const bal = currentBalance(rows, account.accountNo);
    docs.push({
      id: `DATA-SAV-${account.accountNo}`,
      kind: "savings",
      title: `${account.product} ${account.accountNo}`,
      category: "Rekening Simpanan",
      cif,
      keywords: [
        "rekening",
        "tabungan",
        "giro",
        "deposito",
        "saldo",
        account.type,
        account.accountNo,
        account.product.toLowerCase(),
        name.toLowerCase(),
      ],
      text: [
        `Nasabah: ${name} (CIF ${cif})`,
        `Produk: ${account.product}`,
        `Nomor: ${account.accountNo}`,
        `Jenis: ${account.type} | Status: ${account.status} | Valuta: ${account.currency}`,
        `Saldo current (compute ${formatIdDate(clock)}): ${formatIdr(bal)}`,
        `Bunga: ${(account.interestRate * 100).toFixed(2)}% | Buka: ${account.openedOn}`,
        `Target saldo rata-rata: ${formatIdr(account.monthlyAvgTarget)}`,
        account.type === "deposit" ? describeDeposit(account, clock) : "",
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }

  for (const loan of profile.loans) {
    const pay = installment(loan);
    const started = new Date(loan.startedOn);
    const elapsed =
      (clock.getFullYear() - started.getFullYear()) * 12 + (clock.getMonth() - started.getMonth());
    const remaining = Math.max(0, loan.tenorMonths - elapsed);
    docs.push({
      id: `DATA-LN-${loan.accountNo}`,
      kind: "loan",
      title: `${loan.product} ${loan.accountNo}`,
      category: "Rekening Pinjaman",
      cif,
      keywords: [
        "pinjaman",
        "kredit",
        "angsuran",
        "kpr",
        "kta",
        "kkb",
        "kur",
        "paylater",
        loan.type,
        loan.accountNo,
        loan.product.toLowerCase(),
        name.toLowerCase(),
      ],
      text: [
        `Nasabah: ${name} (CIF ${cif})`,
        `Produk: ${loan.product} (${loan.type})`,
        `Nomor fasilitas: ${loan.accountNo}`,
        `Pokok: ${formatIdr(loan.principal)} | Tenor: ${loan.tenorMonths} bulan | Rate: ${(loan.annualRate * 100).toFixed(2)}%`,
        `Mulai: ${loan.startedOn} | Angsuran: ${formatIdr(pay)} / bulan`,
        `Sisa tenor ±${remaining} bulan | Outstanding ±${formatIdr(remaining * pay)}`,
        `Status: ${loan.status}${loan.collateral ? ` | Agunan: ${loan.collateral}` : ""}`,
      ].join("\n"),
    });
  }

  for (const card of profile.cards) {
    const monthRows = rows.filter(
      (t) => t.accountNo === `CC${card.last4}` && t.bookedAt.slice(0, 7) === clock.toISOString().slice(0, 7),
    );
    const spend = monthRows
      .filter((t) => t.type === "cc_purchase" || t.type === "cc_cash_advance")
      .reduce((s, t) => s + t.debit, 0);
    const paid = monthRows.filter((t) => t.type === "cc_payment").reduce((s, t) => s + t.credit, 0);
    docs.push({
      id: `DATA-CC-${card.last4}`,
      kind: "card",
      title: `${card.product} •••• ${card.last4}`,
      category: "Kartu Kredit",
      cif,
      keywords: [
        "kartu kredit",
        "tagihan",
        "limit",
        "cc",
        card.last4,
        card.brand,
        card.product.toLowerCase(),
        name.toLowerCase(),
      ],
      text: [
        `Nasabah: ${name} (CIF ${cif})`,
        `Produk: ${card.product} (${card.brand})`,
        `Nomor: ${card.cardNoMasked} | Status: ${card.status}`,
        `Limit: ${formatIdr(card.limit)} | Jatuh tempo tanggal ${card.dueDay}`,
        `Autodebet dari: ${card.paymentAccountNo} | Buka: ${card.openedOn}`,
        `Belanja bulan berjalan: ${formatIdr(spend)} | Sudah dibayar: ${formatIdr(paid)}`,
        `Outstanding siklus ini ±${formatIdr(Math.max(0, spend - paid))}`,
      ].join("\n"),
    });
  }

  for (const pos of profile.wealth) {
    const value = wealthMarketValue(pos, clock);
    docs.push({
      id: `DATA-WM-${pos.id}`,
      kind: "wealth",
      title: `${pos.product} ${name}`,
      category: "Wealth Management",
      cif,
      keywords: [
        "investasi",
        "reksa",
        "wealth",
        "obligasi",
        "nav",
        pos.kind,
        pos.product.toLowerCase(),
        name.toLowerCase(),
      ],
      text: [
        `Nasabah: ${name} (CIF ${cif})`,
        `Produk: ${pos.product} (${pos.kind}, risiko ${pos.risk})`,
        `Unit: ${pos.units.toLocaleString("id-ID")} | NAV beli: ${formatIdr(pos.navAtBuy)}`,
        `Nilai pasar compute ${formatIdDate(clock)}: ±${formatIdr(value)}`,
        `Tanggal beli: ${pos.boughtOn}`,
      ].join("\n"),
    });
  }

  const byAccount = new Map<string, BankTransaction[]>();
  for (const tx of rows) {
    const list = byAccount.get(tx.accountNo) ?? [];
    list.push(tx);
    byAccount.set(tx.accountNo, list);
  }

  for (const [accountNo, list] of byAccount) {
    const months = new Map<string, BankTransaction[]>();
    for (const tx of list) {
      const key = monthKey(tx.bookedAt);
      const bucket = months.get(key) ?? [];
      bucket.push(tx);
      months.set(key, bucket);
    }

    for (const [key, monthRows] of months) {
      const debit = monthRows.reduce((s, t) => s + t.debit, 0);
      const credit = monthRows.reduce((s, t) => s + t.credit, 0);
      const types = [...new Set(monthRows.map((t) => t.type))];
      const sample = monthRows.slice(0, 8).map(txLine);
      const last = monthRows[monthRows.length - 1];
      docs.push({
        id: `DATA-TXM-${accountNo}-${key}`,
        kind: "tx_month",
        title: `Mutasi ${accountNo} ${monthLabel(key)}`,
        category: "Mutasi Bulanan",
        cif,
        keywords: [
          "mutasi",
          "transaksi",
          "riwayat",
          accountNo,
          key,
          monthLabel(key).toLowerCase(),
          ...types,
          name.toLowerCase(),
        ],
        text: [
          `Nasabah: ${name} (CIF ${cif})`,
          `Rekening: ${accountNo} | Periode: ${monthLabel(key)}`,
          `Jumlah transaksi: ${monthRows.length} | Debet: ${formatIdr(debit)} | Kredit: ${formatIdr(credit)}`,
          `Jenis: ${types.join(", ")}`,
          `Saldo akhir periode: ${last ? formatIdr(last.balanceAfter) : "-"}`,
          "Contoh transaksi:",
          ...sample,
        ].join("\n"),
      });
    }

    const typeGroups = new Map<string, BankTransaction[]>();
    for (const tx of list) {
      const bucket = typeGroups.get(tx.type) ?? [];
      bucket.push(tx);
      typeGroups.set(tx.type, bucket);
    }
    for (const [type, typed] of typeGroups) {
      const last12 = typed.slice(-18);
      const debit = last12.reduce((s, t) => s + t.debit, 0);
      const credit = last12.reduce((s, t) => s + t.credit, 0);
      docs.push({
        id: `DATA-TXT-${accountNo}-${type}`,
        kind: "transaction",
        title: `Ringkasan ${type} rekening ${accountNo}`,
        category: "Ringkasan Jenis Transaksi",
        cif,
        keywords: ["transaksi", type, accountNo, name.toLowerCase(), "atm", "qris", "kartu", "angsuran"],
        text: [
          `Nasabah: ${name} (CIF ${cif})`,
          `Jenis: ${type} | Rekening: ${accountNo}`,
          `Cuplikan ${last12.length} transaksi terakhir jenis ini`,
          `Debet: ${formatIdr(debit)} | Kredit: ${formatIdr(credit)}`,
          ...last12.slice(-8).map(txLine),
        ].join("\n"),
      });
    }
  }

  return docs;
}
