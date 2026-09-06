import { formatIdDate, now, startOfDay } from "../dates";
import {
  assistantOfferedAppointment,
  hasBankingThread,
  isHardOffTopicMessage,
  lastUserIndex,
  priorChat,
} from "../guardrail";
import type { ChatMessage, CustomerProfile } from "../types";
import { allOutlets, outletsByCity, type Outlet } from "../services/locations";

export type BranchAppointment = {
  id: string;
  cif: string;
  customerName: string;
  when: Date;
  weekdayLabel: string;
  dateLabel: string;
  timeLabel: string;
  branchName: string;
  branchAddress: string;
  city: string;
  purpose: string;
  officer: string;
  lounge: boolean;
};

const WEEKDAYS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const;

const WEEKDAY_INDEX: Record<string, number> = {
  minggu: 0,
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5,
  sabtu: 6,
};

const CITY_HINTS = [
  "surabaya",
  "jakarta selatan",
  "jakarta pusat",
  "jakarta barat",
  "jakarta utara",
  "jakarta timur",
  "cibubur",
  "bandung",
  "bekasi",
  "bogor",
  "depok",
  "tangerang",
  "sidoarjo",
  "malang",
  "semarang",
  "yogyakarta",
  "medan",
];

const SCHEDULE_INTENT =
  /\b(jadwal(?:kan)?|janji\s*temu|appointment|reservasi|buat(?:kan)?(?:\s+janji)?|jadi(?:in|kan)?)\b/i;

const CONFIRM =
  /^(ok(?:e|ay)?|ya+|iya|boleh|silakan|jadi(?:in|kan)?|lanjut|setuju|please|tolong)(\b|[!,.])/i;

let seq = 0;
const store: BranchAppointment[] = [];

export function normalizeFollowUpText(text: string): string {
  return text
    .toLowerCase()
    .replace(/minggdep|mingdep|minggudepan/g, "minggu depan")
    .replace(/\b(mgg|mnggu|minggu)\s+(dpn|depn|depan)\b/g, "minggu depan")
    .replace(/jum'?at/g, "jumat");
}

export function looksLikeScheduleDatetime(message: string): boolean {
  const q = normalizeFollowUpText(message);
  if (/\b(barusan|baru saja|baru aja|terakhir|kemarin|semalam|\btadi\b)\b/.test(q)) {
    return false;
  }
  return /\b(besok|lusa|nanti|senin|selasa|rabu|kamis|jumat|sabtu|minggu depan|jam\s*\d{1,2}|pukul\s*\d{1,2}|pagi|siang|sore|malam)\b/.test(
    q,
  );
}

export function looksLikeScheduleIntent(message: string): boolean {
  return SCHEDULE_INTENT.test(normalizeFollowUpText(message));
}

export function looksLikeConfirmFollowUp(message: string): boolean {
  const q = message.trim();
  if (!q || q.length > 180) return false;
  return CONFIRM.test(q) || /^(ok(?:e|ay)?|ya+|iya|boleh)\s+/i.test(q);
}

function blob(messages: ChatMessage[]): string {
  return messages.map((m) => m.content).join("\n");
}

function startOfWeekMonday(clock: Date): Date {
  const copy = startOfDay(clock);
  const day = copy.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + offset);
  return copy;
}

function nextBusinessDay(clock: Date): Date {
  const d = startOfDay(clock);
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

function weekdayOfWeek(weekMonday: Date, weekday: number): Date {
  const d = new Date(weekMonday);
  d.setDate(d.getDate() + (weekday === 0 ? 6 : weekday - 1));
  return d;
}

export function parseAppointmentWhen(message: string, clock = now()): Date {
  const q = normalizeFollowUpText(message);
  const nextWeek = /\bminggu depan\b/.test(q);
  let weekday: number | undefined;
  for (const [name, idx] of Object.entries(WEEKDAY_INDEX)) {
    if (name === "minggu" && /\bminggu depan\b/.test(q) && !/\bhari minggu\b/.test(q)) {
      continue;
    }
    if (new RegExp(`\\b${name}\\b`).test(q)) {
      weekday = idx;
      break;
    }
  }

  let day: Date;
  if (weekday !== undefined) {
    const thisMon = startOfWeekMonday(clock);
    const weekMon = new Date(thisMon);
    if (nextWeek) weekMon.setDate(weekMon.getDate() + 7);
    day = weekdayOfWeek(weekMon, weekday);
    if (!nextWeek && day.getTime() <= startOfDay(clock).getTime()) {
      day.setDate(day.getDate() + 7);
    }
  } else if (nextWeek) {
    const nextMon = startOfWeekMonday(clock);
    nextMon.setDate(nextMon.getDate() + 7);
    day = nextMon;
  } else if (/\bbesok\b/.test(q)) {
    day = startOfDay(clock);
    day.setDate(day.getDate() + 1);
  } else if (/\blusa\b/.test(q)) {
    day = startOfDay(clock);
    day.setDate(day.getDate() + 2);
  } else {
    day = nextBusinessDay(clock);
  }

  const hm = q.match(/\b(?:jam|pukul)\s*(\d{1,2})(?:[.:](\d{2}))?\b/);
  let hour = 10;
  let minute = 0;
  if (hm) {
    hour = Math.min(16, Math.max(8, Number(hm[1])));
    minute = hm[2] ? Number(hm[2]) : 0;
  } else if (/\bpagi\b/.test(q)) {
    hour = 9;
  } else if (/\bsiang\b/.test(q)) {
    hour = 13;
  } else if (/\bsore\b/.test(q)) {
    hour = 15;
  }

  day.setHours(hour, minute, 0, 0);
  return day;
}

function cityFromBlob(text: string): string | undefined {
  const q = text.toLowerCase();
  const hit = CITY_HINTS.find((c) => q.includes(c));
  if (!hit) return undefined;
  return hit
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function resolveAppointmentBranch(
  messages: ChatMessage[],
  profile?: CustomerProfile,
): Outlet {
  const text = blob(messages);
  const q = text.toLowerCase();
  const outlets = allOutlets().filter((o) => o.kind === "kc" || o.kind === "kcp");

  const named = outlets.find(
    (o) =>
      q.includes(o.name.toLowerCase()) ||
      q.includes(o.id.toLowerCase()) ||
      (o.kind === "kc" && q.includes(`kc ${o.name.replace(/^kc bang digital /i, "").toLowerCase()}`)),
  );
  if (named) return named;

  const area = q.match(/\b(?:kc|kcp)\s+([a-z]+)\b/i);
  if (area?.[1]) {
    const byArea = outlets.find((o) => o.name.toLowerCase().includes(area[1]!.toLowerCase()));
    if (byArea) return byArea;
  }

  const city = cityFromBlob(text);
  if (city) {
    const kc = outletsByCity(city, "kc")[0];
    if (kc) return kc;
  }

  if (profile) {
    const home = outlets.find((o) => o.name === profile.cif.branch);
    if (home) return home;
    const byCity = outletsByCity(profile.cif.city, "kc")[0];
    if (byCity) return byCity;
  }

  return outletsByCity("Jakarta Selatan", "kc")[0] ?? outlets[0]!;
}

function officerFromThread(messages: ChatMessage[]): { purpose: string; officer: string } {
  const userQ = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join("\n")
    .toLowerCase();
  const meetQ = messages
    .filter((m) => m.role === "assistant")
    .map((m) => m.content)
    .filter((t) => /pertemuan|janji\s*temu|ketemu|jadwalkan pertemuan/i.test(t))
    .join("\n")
    .toLowerCase();
  const q = `${userQ}\n${meetQ}`;
  if (/\bkpr\b|kredit rumah/.test(q)) {
    return { purpose: "Janji temu AO KPR", officer: "Account Officer (AO) KPR" };
  }
  if (/\b(pincapem|pimpinan cabang pembantu)\b/.test(q)) {
    return { purpose: "Janji temu Pincapem", officer: "Pimpinan Cabang Pembantu" };
  }
  if (/\b(pinca|pimcab|pimpinan cabang|kepala cabang)\b/.test(q)) {
    return { purpose: "Janji temu Pimpinan Cabang", officer: "Pimpinan Cabang (Pinca)" };
  }
  if (/\b(kaunit|ka unit|kepala unit)\b/.test(q)) {
    return { purpose: "Janji temu Kepala Unit", officer: "Kepala Unit (Kaunit)" };
  }
  if (/\bmantri/.test(q)) {
    return { purpose: "Janji temu Mantri Kredit", officer: "Mantri Kredit" };
  }
  if (/\b(fo|front office)\b/.test(q)) {
    return { purpose: "Janji temu Front Office", officer: "Front Office (FO)" };
  }
  if (/\b(rm|relationship manager)\b/.test(q)) {
    return { purpose: "Janji temu Relationship Manager", officer: "Relationship Manager (RM)" };
  }
  if (/\b(ao|account officer)\b/.test(q)) {
    return { purpose: "Janji temu Account Officer", officer: "Account Officer (AO)" };
  }
  if (/\b(teller)\b/.test(userQ)) {
    return { purpose: "Janji temu teller", officer: "Teller" };
  }
  return { purpose: "Kunjungan prioritas lounge", officer: "CS Prioritas" };
}

function nextId(at: Date): string {
  seq += 1;
  const y = String(at.getFullYear()).slice(2);
  const m = String(at.getMonth() + 1).padStart(2, "0");
  const d = String(at.getDate()).padStart(2, "0");
  return `BDAPT-${y}${m}${d}-${String(seq).padStart(4, "0")}`;
}

export function createAppointment(params: {
  profile?: CustomerProfile;
  messages: ChatMessage[];
  userText: string;
  clock?: Date;
}): BranchAppointment {
  const clock = params.clock ?? now();
  const when = parseAppointmentWhen(params.userText, clock);
  const outlet = resolveAppointmentBranch(params.messages, params.profile);
  const { purpose, officer } = officerFromThread(params.messages);
  const lounge =
    params.profile?.cif.segment === "priority" ||
    /lounge|prioritas/.test(blob(params.messages).toLowerCase()) ||
    purpose.includes("lounge");
  const appt: BranchAppointment = {
    id: nextId(when),
    cif: params.profile?.cif.cif ?? "1001001000",
    customerName: params.profile?.cif.name ?? "Nasabah",
    when,
    weekdayLabel: WEEKDAYS[when.getDay()] ?? "",
    dateLabel: formatIdDate(when),
    timeLabel: `${String(when.getHours()).padStart(2, "0")}.${String(when.getMinutes()).padStart(2, "0")}`,
    branchName: outlet.name,
    branchAddress: outlet.address,
    city: outlet.city,
    purpose,
    officer,
    lounge,
  };
  store.unshift(appt);
  return appt;
}

export function formatAppointmentReply(appt: BranchAppointment): string {
  const who = appt.customerName.split(" ")[0] ?? appt.customerName;
  const loungeLine = appt.lounge
    ? "Layanan: priority lounge (nasabah prioritas, tanpa antri teller reguler)."
    : `Petugas: ${appt.officer}.`;
  return `Baik ${who}, janji temu sudah saya konfirmasi — tidak perlu KYC tambahan.

Hari: ${appt.weekdayLabel}, ${appt.dateLabel}
Jam: ${appt.timeLabel} WIB
Cabang: ${appt.branchName} — ${appt.branchAddress}
Keperluan: ${appt.purpose}
${loungeLine}
Kode janji: ${appt.id}

Datang ±10 menit lebih awal, bawa KTP. Kalau mau ubah jam atau cabang, sebut saja.`;
}

export function formatAppointmentAsk(): string {
  return "Baik, saya bisa buatkan janji temu cabang — AO, RM, FO, Pinca, Pincapem, Kaunit, Mantri, teller, atau priority lounge. Mau ketemu siapa, cabang mana, dan jam berapa?";
}

export function shouldConfirmAppointment(messages: ChatMessage[]): boolean {
  const idx = lastUserIndex(messages);
  if (idx < 0) return false;
  const last = messages[idx]!.content.trim();
  if (!last || isHardOffTopicMessage(last)) return false;
  const prior = messages.slice(0, idx);
  if (!hasBankingThread(prior) && !prior.some((m) => m.role === "assistant" && assistantOfferedAppointment(m.content))) {
    return false;
  }
  const offered = prior.some((m) => m.role === "assistant" && assistantOfferedAppointment(m.content));
  if (looksLikeScheduleIntent(last)) return true;
  if (looksLikeScheduleDatetime(last) && (offered || hasBankingThread(prior))) return true;
  if (looksLikeConfirmFollowUp(last) && offered) return true;
  return false;
}

export function resolveAppointmentReply(
  messages: ChatMessage[],
  profile?: CustomerProfile,
): string | null {
  const idx = lastUserIndex(messages);
  if (idx < 0) return null;
  const userText = messages[idx]!.content;
  if (shouldConfirmAppointment(messages)) {
    return formatAppointmentReply(createAppointment({ profile, messages, userText }));
  }
  if (looksLikeScheduleIntent(userText) && !hasBankingThread(priorChat(messages))) {
    return formatAppointmentAsk();
  }
  return null;
}
