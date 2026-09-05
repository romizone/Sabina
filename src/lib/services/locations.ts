export type OutletKind = "kc" | "kcp" | "atm" | "crm";

export interface Outlet {
  id: string;
  kind: OutletKind;
  name: string;
  address: string;
  city: string;
  hours: string;
  services: string[];
}

const HUBS: { city: string; area: string; street: string }[] = [
  { city: "Cibubur", area: "Cibubur", street: "Jl. Alternatif Cibubur No. 1" },
  { city: "Jakarta Selatan", area: "Senayan", street: "Jl. Asia Afrika No. 8" },
  { city: "Jakarta Pusat", area: "Sudirman", street: "Jl. Jend. Sudirman Kav. 52" },
  { city: "Jakarta Barat", area: "Kebon Jeruk", street: "Jl. Panjang No. 11" },
  { city: "Jakarta Utara", area: "Kelapa Gading", street: "Jl. Boulevard Raya Blok M" },
  { city: "Jakarta Timur", area: "Cakung", street: "Jl. Raya Bekasi Km 18" },
  { city: "Bandung", area: "Dago", street: "Jl. Ir. H. Djuanda No. 45" },
  { city: "Bekasi", area: "Summarecon", street: "Jl. Bulevar Ahmad Yani" },
  { city: "Bogor", area: "Pajajaran", street: "Jl. Pajajaran No. 21" },
  { city: "Depok", area: "Margonda", street: "Jl. Margonda Raya No. 210" },
  { city: "Tangerang", area: "BSD", street: "Jl. Pahlawan Seribu" },
  { city: "Tangerang Selatan", area: "Bintaro", street: "Jl. Boulevard Bintaro Jaya" },
  { city: "Surabaya", area: "Darmo", street: "Jl. Raya Darmo No. 9" },
  { city: "Sidoarjo", area: "Ahmad Yani", street: "Jl. A. Yani No. 17" },
  { city: "Malang", area: "Klojen", street: "Jl. Basuki Rahmat No. 4" },
  { city: "Semarang", area: "Simpang Lima", street: "Jl. Pandanaran No. 3" },
  { city: "Yogyakarta", area: "Malioboro", street: "Jl. Malioboro No. 52" },
  { city: "Sleman", area: "Kaliurang", street: "Jl. Kaliurang Km 7" },
  { city: "Solo", area: "Slamet Riyadi", street: "Jl. Slamet Riyadi No. 88" },
  { city: "Medan", area: "Polonia", street: "Jl. Imam Bonjol No. 77" },
  { city: "Palembang", area: "Sudirman", street: "Jl. Jend. Sudirman No. 10" },
  { city: "Pekanbaru", area: "Sudirman", street: "Jl. Jend. Sudirman No. 199" },
  { city: "Padang", area: "Bagindo Aziz", street: "Jl. Bagindo Aziz Chan" },
  { city: "Bandar Lampung", area: "Kartini", street: "Jl. Kartini No. 12" },
  { city: "Makassar", area: "Panakkukang", street: "Jl. Pengayoman No. 55" },
  { city: "Manado", area: "Sam Ratulangi", street: "Jl. Sam Ratulangi No. 7" },
  { city: "Denpasar", area: "Renon", street: "Jl. Raya Puputan Renon" },
  { city: "Badung", area: "Kuta", street: "Jl. Raya Kuta No. 88" },
  { city: "Balikpapan", area: "Jend Sudirman", street: "Jl. Jend. Sudirman No. 31" },
  { city: "Samarinda", area: "Pahlawan", street: "Jl. Pahlawan No. 2" },
  { city: "Pontianak", area: "Tanjungpura", street: "Jl. Tanjungpura No. 15" },
  { city: "Banjarmasin", area: "A Yani", street: "Jl. A. Yani Km 3" },
  { city: "Batam", area: "Nagoya", street: "Jl. Imam Bonjol Nagoya" },
  { city: "Ambon", area: "Pattimura", street: "Jl. Dr. J. Leimena" },
  { city: "Kupang", area: "El Tari", street: "Jl. Jend. Soeharto" },
  { city: "Mataram", area: "Pejanggik", street: "Jl. Pejanggik No. 20" },
  { city: "Jayapura", area: "Abepura", street: "Jl. Raya Abepura" },
  { city: "Banda Aceh", area: "Tgk Daud", street: "Jl. Tgk. Daud Beureueh" },
  { city: "Jambi", area: "Gatot Subroto", street: "Jl. Gatot Subroto" },
];

function buildOutlets(): Outlet[] {
  const list: Outlet[] = [];
  HUBS.forEach((hub, i) => {
    const n = String(i + 1).padStart(3, "0");
    list.push({
      id: `KC-${n}`,
      kind: "kc",
      name: `KC Bang Digital ${hub.area}`,
      address: `${hub.street}, ${hub.city}`,
      city: hub.city,
      hours: "Senin–Jumat 08.00–15.00 WIB",
      services: ["teller", "CS", "prioritas", "pembukaan rekening", "KPR", "safe deposit"],
    });
    list.push({
      id: `KCP-${n}`,
      kind: "kcp",
      name: `KCP Bang Digital ${hub.area}`,
      address: `${hub.street} Blok B, ${hub.city}`,
      city: hub.city,
      hours: "Senin–Jumat 08.00–15.00 WIB",
      services: ["teller", "CS", "setor tunai", "ganti kartu"],
    });
    list.push({
      id: `ATM-${n}A`,
      kind: "atm",
      name: `ATM Bang Digital ${hub.area}`,
      address: `${hub.street} (lobby KC), ${hub.city}`,
      city: hub.city,
      hours: "24 jam",
      services: ["tarik tunai", "transfer", "cek saldo", "tarik tanpa kartu"],
    });
    list.push({
      id: `ATM-${n}B`,
      kind: "atm",
      name: `ATM Mall ${hub.area}`,
      address: `Mall ${hub.area}, ${hub.city}`,
      city: hub.city,
      hours: "24 jam (akses mengikuti mall)",
      services: ["tarik tunai", "transfer", "cek saldo"],
    });
    list.push({
      id: `CRM-${n}`,
      kind: "crm",
      name: `CRM Bang Digital ${hub.area}`,
      address: `${hub.street} (sisi kanan KC), ${hub.city}`,
      city: hub.city,
      hours: "05.00–22.00 WIB",
      services: ["setor tunai", "tarik tunai", "cetak mutasi"],
    });
  });
  return list;
}

let _outlets: Outlet[] | null = null;

export function allOutlets(): Outlet[] {
  if (!_outlets) _outlets = buildOutlets();
  return _outlets;
}

export function searchOutlets(query: string, kind?: OutletKind): Outlet[] {
  const q = query.toLowerCase();
  return allOutlets().filter((o) => {
    if (kind && o.kind !== kind) return false;
    const hay = `${o.city} ${o.name} ${o.address} ${o.kind}`.toLowerCase();
    return hay.includes(q) || q.split(/\s+/).some((t) => t.length > 2 && hay.includes(t));
  });
}

export function outletsByCity(city: string, kind?: OutletKind): Outlet[] {
  const c = city.toLowerCase();
  return allOutlets().filter(
    (o) => o.city.toLowerCase().includes(c) && (!kind || o.kind === kind),
  );
}

export function formatOutlet(o: Outlet): string {
  return `${o.name} (${o.kind.toUpperCase()}) — ${o.address}. Jam: ${o.hours}. Layanan: ${o.services.join(", ")}.`;
}
