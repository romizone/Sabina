import { getCustomer } from "@/lib/data/customers";
import { createTicket, listTickets } from "@/lib/tickets";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const cif = new URL(req.url).searchParams.get("cif") ?? undefined;
  return Response.json({ tickets: listTickets(cif) });
}

export async function POST(req: Request) {
  const body = (await req.json()) as { cif?: string; message?: string };
  const profile = body.cif ? getCustomer(body.cif) : undefined;
  const ticket = createTicket({
    profile,
    cif: body.cif,
    message: body.message ?? "Pengaduan layanan",
  });
  if (!ticket) {
    return Response.json({ error: "Tidak terdeteksi sebagai pengaduan" }, { status: 400 });
  }
  return Response.json({ ticket });
}
