import { isoDate, now, yearsAgo } from "../dates";
import type {
  CardBrand,
  Cif,
  CustomerProfile,
  CustomerSegment,
} from "../types";

function openedYearsAgo(years: number, month: number, day: number): string {
  return isoDate(yearsAgo(years, month, day));
}

const SCALE: Record<
  CustomerSegment,
  {
    sav: number;
    rencana: number;
    giro: number;
    dep: number;
    kpr: number;
    kta: number;
    kkb: number;
    kur: number;
    paylater: number;
    card: number;
  }
> = {
  priority: {
    sav: 28_000_000,
    rencana: 3_500_000,
    giro: 42_000_000,
    dep: 250_000_000,
    kpr: 850_000_000,
    kta: 80_000_000,
    kkb: 350_000_000,
    kur: 200_000_000,
    paylater: 12_000_000,
    card: 80_000_000,
  },
  affluent: {
    sav: 18_000_000,
    rencana: 2_500_000,
    giro: 35_000_000,
    dep: 180_000_000,
    kpr: 650_000_000,
    kta: 50_000_000,
    kkb: 280_000_000,
    kur: 150_000_000,
    paylater: 10_000_000,
    card: 50_000_000,
  },
  sme: {
    sav: 12_000_000,
    rencana: 2_000_000,
    giro: 62_000_000,
    dep: 100_000_000,
    kpr: 500_000_000,
    kta: 40_000_000,
    kkb: 220_000_000,
    kur: 350_000_000,
    paylater: 8_000_000,
    card: 30_000_000,
  },
  personal: {
    sav: 8_000_000,
    rencana: 1_500_000,
    giro: 15_000_000,
    dep: 50_000_000,
    kpr: 450_000_000,
    kta: 35_000_000,
    kkb: 180_000_000,
    kur: 75_000_000,
    paylater: 6_000_000,
    card: 15_000_000,
  },
};

function book(params: {
  cif: Cif;
  last4: string;
  brand: CardBrand;
  dueDay: number;
  house: string;
  vehicle: string;
  depositTenor: 3 | 6 | 12;
  late?: boolean;
}): CustomerProfile {
  const s = SCALE[params.cif.segment];
  const tail = params.cif.cif.slice(-4);
  const savNo = `880100${tail}`;
  const rencanaNo = `880200${tail}`;
  const giroNo = `890100${tail}`;
  const depNo = `870100${tail}`;
  const depRate = params.depositTenor === 12 ? 0.051 : params.depositTenor === 6 ? 0.0475 : 0.0425;
  const cardProduct =
    params.brand === "platinum"
      ? "BangKartu Platinum"
      : params.brand === "gold"
        ? "BangKartu Gold"
        : "BangKartu Classic";

  return {
    cif: params.cif,
    savings: [
      {
        accountNo: savNo,
        type: "savings",
        product: "BangTabungan Digital",
        currency: "IDR",
        openedOn: params.cif.openedOn,
        status: "active",
        interestRate: 0.022 + (params.cif.segment === "priority" ? 0.006 : 0.002),
        monthlyAvgTarget: s.sav,
      },
      {
        accountNo: rencanaNo,
        type: "savings",
        product: "BangTabungan Rencana",
        currency: "IDR",
        openedOn: openedYearsAgo(3, 0, 12),
        status: "active",
        interestRate: 0.035,
        monthlyAvgTarget: s.rencana,
      },
      {
        accountNo: giroNo,
        type: "giro",
        product: "BangGiro Usaha",
        currency: "IDR",
        openedOn: openedYearsAgo(6, 2, 8),
        status: "active",
        interestRate: 0.01,
        monthlyAvgTarget: s.giro,
      },
      {
        accountNo: depNo,
        type: "deposit",
        product: `BangDeposito ${params.depositTenor} Bulan`,
        currency: "IDR",
        openedOn: openedYearsAgo(params.depositTenor === 12 ? 2 : 1, 5, 3),
        status: "active",
        interestRate: depRate,
        monthlyAvgTarget: s.dep,
        tenorMonths: params.depositTenor,
        aro: true,
      },
    ],
    loans: [
      {
        accountNo: `770100${tail}`,
        type: "kpr",
        product: "BangKPR",
        principal: s.kpr,
        tenorMonths: 180,
        annualRate: 0.085,
        startedOn: openedYearsAgo(7, 2, 15),
        collateral: params.house,
        status: "current",
      },
      {
        accountNo: `774100${tail}`,
        type: "kta",
        product: "BangPinjam KTA",
        principal: s.kta,
        tenorMonths: 36,
        annualRate: 0.149,
        startedOn: openedYearsAgo(1, 1, 6),
        status: params.late ? "late" : "current",
      },
      {
        accountNo: `771100${tail}`,
        type: "kkb",
        product: "BangKKB",
        principal: s.kkb,
        tenorMonths: 48,
        annualRate: 0.079,
        startedOn: openedYearsAgo(2, 9, 2),
        collateral: params.vehicle,
        status: "current",
      },
      {
        accountNo: `775100${tail}`,
        type: "kur",
        product: "BangKUR",
        principal: s.kur,
        tenorMonths: 36,
        annualRate: 0.06,
        startedOn: openedYearsAgo(1, 4, 10),
        collateral: "Usaha produktif",
        status: "current",
      },
      {
        accountNo: `772100${tail}`,
        type: "paylater",
        product: "BangPaylater",
        principal: s.paylater,
        tenorMonths: 12,
        annualRate: 0.18,
        startedOn: openedYearsAgo(0, now().getMonth(), 3),
        status: "current",
      },
    ],
    cards: [
      {
        cardNoMasked: `5221 94•• •••• ${params.last4}`,
        last4: params.last4,
        brand: params.brand,
        product: cardProduct,
        limit: s.card,
        openedOn: openedYearsAgo(5, 3, 9),
        status: params.late ? "late" : "active",
        dueDay: params.dueDay,
        paymentAccountNo: savNo,
      },
    ],
    wealth: [
      {
        id: `W-${tail}-RDPU`,
        kind: "rdpu",
        product: "BangInvest Pasar Uang",
        units: Math.round(s.sav / 20),
        navAtBuy: 1_200,
        boughtOn: openedYearsAgo(3, 1, 10),
        risk: "low",
      },
      {
        id: `W-${tail}-RDS`,
        kind: "rds",
        product: "BangInvest Saham Nusantara",
        units: Math.round(s.sav / 80),
        navAtBuy: 2_400,
        boughtOn: openedYearsAgo(2, 7, 9),
        risk: "high",
      },
      {
        id: `W-${tail}-RDPT`,
        kind: "rdpt",
        product: "BangInvest Pendapatan Tetap",
        units: Math.round(s.sav / 40),
        navAtBuy: 1_500,
        boughtOn: openedYearsAgo(2, 3, 15),
        risk: "medium",
      },
      {
        id: `W-${tail}-BOND`,
        kind: "bond",
        product: "BangObligasi Negara Ritel",
        units: 20,
        navAtBuy: 1_000_000,
        boughtOn: openedYearsAgo(1, 8, 5),
        risk: "low",
      },
    ],
  };
}

export const CUSTOMERS: CustomerProfile[] = [
  book({
    cif: {
      cif: "1001001000",
      name: "Ierfan Syuckhur",
      dob: "1990-09-14",
      pob: "Jakarta",
      nikMasked: "3171••••••1409",
      npwpMasked: "12.•••.•••.1-401.000",
      address: "Jl. Senopati No. 7",
      city: "Jakarta Selatan",
      phone: "0812-1000-1000",
      email: "ierfan.syuckhur@mail.test",
      segment: "priority",
      kycStatus: "verified",
      riskRating: "low",
      openedOn: openedYearsAgo(8, 4, 11),
      branch: "KC Bang Digital Senayan",
      occupation: "Direktur Teknologi",
      motherMaiden: "Hasanah",
    },
    last4: "1010",
    brand: "platinum",
    dueDay: 15,
    house: "Rumah SHM Senopati",
    vehicle: "Mobil BPKB Jakarta",
    depositTenor: 12,
  }),
  book({
    cif: {
      cif: "1001001001",
      name: "Somat Gzodin",
      dob: "1988-04-12",
      pob: "Jakarta",
      nikMasked: "3174••••••1204",
      npwpMasked: "10.•••.•••.4-411.000",
      address: "Jl. Alternatif Cibubur No. 18",
      city: "Cibubur",
      phone: "0812-1001-1001",
      email: "somat.gzodin@mail.test",
      segment: "priority",
      kycStatus: "verified",
      riskRating: "low",
      openedOn: openedYearsAgo(9, 2, 8),
      branch: "KC Bang Digital Cibubur",
      occupation: "Direktur Operasional",
      motherMaiden: "Sulastri",
    },
    last4: "4412",
    brand: "platinum",
    dueDay: 17,
    house: "Rumah SHM Cibubur",
    vehicle: "Mobil BPKB Cibubur",
    depositTenor: 12,
  }),
  book({
    cif: {
      cif: "1001001002",
      name: "Yofa Arindita",
      dob: "1992-11-03",
      pob: "Bandung",
      nikMasked: "3273••••••0309",
      npwpMasked: "24.•••.•••.2-424.000",
      address: "Jl. Dago No. 45",
      city: "Bandung",
      phone: "0813-2002-2002",
      email: "yofa.arindita@mail.test",
      segment: "personal",
      kycStatus: "verified",
      riskRating: "low",
      openedOn: openedYearsAgo(8, 6, 21),
      branch: "KC Bang Digital Dago",
      occupation: "Analis Keuangan",
      motherMaiden: "Rohayah",
    },
    last4: "2288",
    brand: "gold",
    dueDay: 12,
    house: "Rumah SHM Dago",
    vehicle: "Mobil BPKB Bandung",
    depositTenor: 6,
  }),
  book({
    cif: {
      cif: "1001001003",
      name: "Triv Danarfo",
      dob: "1980-07-27",
      pob: "Surabaya",
      nikMasked: "3578••••••2707",
      npwpMasked: "07.•••.•••.8-601.000",
      address: "Jl. Dharmahusada No. 9",
      city: "Surabaya",
      phone: "0811-3003-3003",
      email: "triv.danarfo@mail.test",
      segment: "affluent",
      kycStatus: "verified",
      riskRating: "medium",
      openedOn: openedYearsAgo(10, 0, 5),
      branch: "KC Bang Digital Darmo",
      occupation: "Pengusaha Retail",
      motherMaiden: "Wati",
    },
    last4: "9033",
    brand: "gold",
    dueDay: 22,
    house: "Ruko SHM Darmo",
    vehicle: "Mobil BPKB Surabaya",
    depositTenor: 6,
  }),
  book({
    cif: {
      cif: "1001001004",
      name: "Dewi Lestari",
      dob: "1985-01-19",
      pob: "Yogyakarta",
      nikMasked: "3471••••••1901",
      npwpMasked: "31.•••.•••.1-542.000",
      address: "Jl. Kaliurang Km 7 No. 12",
      city: "Sleman",
      phone: "0821-4004-4004",
      email: "dewi.lestari@mail.test",
      segment: "priority",
      kycStatus: "verified",
      riskRating: "low",
      openedOn: openedYearsAgo(9, 9, 30),
      branch: "KC Bang Digital Malioboro",
      occupation: "Manajer Investasi",
      motherMaiden: "Suryani",
    },
    last4: "7744",
    brand: "platinum",
    dueDay: 8,
    house: "Rumah SHM Kaliurang",
    vehicle: "Mobil BPKB Sleman",
    depositTenor: 12,
  }),
  book({
    cif: {
      cif: "1001001005",
      name: "Raka Wijaya",
      dob: "1998-09-08",
      pob: "Depok",
      nikMasked: "3276••••••0809",
      npwpMasked: "88.•••.•••.5-403.000",
      address: "Jl. Margonda Raya No. 210",
      city: "Depok",
      phone: "0857-5005-5005",
      email: "raka.wijaya@mail.test",
      segment: "personal",
      kycStatus: "verified",
      riskRating: "low",
      openedOn: openedYearsAgo(6, 8, 14),
      branch: "KC Bang Digital Margonda",
      occupation: "Software Engineer",
      motherMaiden: "Lilis",
    },
    last4: "5505",
    brand: "classic",
    dueDay: 25,
    house: "Apartemen SHM Margonda",
    vehicle: "Motor BPKB Depok",
    depositTenor: 3,
  }),
  book({
    cif: {
      cif: "1001001006",
      name: "Maya Kusuma",
      dob: "1983-05-16",
      pob: "Medan",
      nikMasked: "1271••••••1605",
      npwpMasked: "02.•••.•••.6-112.000",
      address: "Jl. Imam Bonjol No. 77",
      city: "Medan",
      phone: "0816-6006-6006",
      email: "maya.kusuma@mail.test",
      segment: "sme",
      kycStatus: "verified",
      riskRating: "medium",
      openedOn: openedYearsAgo(8, 3, 4),
      branch: "KC Bang Digital Polonia",
      occupation: "Pemilik UMKM F&B",
      motherMaiden: "Halimah",
    },
    last4: "6606",
    brand: "gold",
    dueDay: 18,
    house: "Ruko SHM Polonia",
    vehicle: "Mobil BPKB Medan",
    depositTenor: 6,
  }),
  book({
    cif: {
      cif: "1001001007",
      name: "Hendra Gunawan",
      dob: "1976-12-02",
      pob: "Semarang",
      nikMasked: "3374••••••0212",
      npwpMasked: "19.•••.•••.7-501.000",
      address: "Jl. Pandanaran No. 3",
      city: "Semarang",
      phone: "0819-7007-7007",
      email: "hendra.gunawan@mail.test",
      segment: "personal",
      kycStatus: "update_required",
      riskRating: "medium",
      openedOn: openedYearsAgo(9, 4, 19),
      branch: "KC Bang Digital Simpang Lima",
      occupation: "Karyawan Swasta",
      motherMaiden: "Tini",
    },
    last4: "1707",
    brand: "classic",
    dueDay: 5,
    house: "Rumah SHM Pandanaran",
    vehicle: "Mobil BPKB Semarang",
    depositTenor: 3,
    late: true,
  }),
  book({
    cif: {
      cif: "1001001008",
      name: "Lina Anggraini",
      dob: "1990-02-25",
      pob: "Makassar",
      nikMasked: "7371••••••2502",
      npwpMasked: "44.•••.•••.8-801.000",
      address: "Jl. Pengayoman No. 55",
      city: "Makassar",
      phone: "0852-8008-8008",
      email: "lina.anggraini@mail.test",
      segment: "affluent",
      kycStatus: "verified",
      riskRating: "low",
      openedOn: openedYearsAgo(7, 11, 11),
      branch: "KC Bang Digital Panakkukang",
      occupation: "Dokter Spesialis",
      motherMaiden: "Nurhayati",
    },
    last4: "8808",
    brand: "platinum",
    dueDay: 20,
    house: "Rumah SHM Panakkukang",
    vehicle: "Mobil BPKB Makassar",
    depositTenor: 3,
  }),
];

export function listCustomers() {
  return CUSTOMERS.map((c) => ({
    cif: c.cif.cif,
    name: c.cif.name,
    city: c.cif.city,
    segment: c.cif.segment,
    phone: c.cif.phone,
  }));
}

export function findCustomer(query: string): CustomerProfile | undefined {
  const q = query.trim().toLowerCase().replace(/\s+/g, "");
  if (!q) return undefined;
  return CUSTOMERS.find((c) => {
    const phones = c.cif.phone.replace(/\D/g, "");
    const digits = q.replace(/\D/g, "");
    return (
      c.cif.cif === q ||
      c.cif.name.toLowerCase().replace(/\s+/g, "") === q ||
      c.cif.name.toLowerCase().includes(query.trim().toLowerCase()) ||
      c.savings.some((a) => a.accountNo === q || a.accountNo === digits) ||
      c.loans.some((a) => a.accountNo === q || a.accountNo === digits) ||
      c.cards.some((card) => card.last4 === digits || card.last4 === q) ||
      (digits.length >= 8 && phones.endsWith(digits))
    );
  });
}

export function getCustomer(cif: string): CustomerProfile | undefined {
  return CUSTOMERS.find((c) => c.cif.cif === cif);
}
