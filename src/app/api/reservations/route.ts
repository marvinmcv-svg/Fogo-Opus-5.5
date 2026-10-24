import { z } from "zod";
import { createReservation } from "@/lib/reservations";

export const runtime = "nodejs";

const Body = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(30),
  email: z.string().trim().max(120).optional(),
  date: z.string(),
  time: z.string(),
  partySize: z.number().int().min(1).max(50),
  occasion: z.string().max(60).optional(),
  notes: z.string().max(400).optional(),
  website: z.string().max(0).optional(), // honeypot
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Please check the form fields." }, { status: 400 });
  const { website: _hp, ...input } = parsed.data;
  const res = await createReservation({ ...input, source: "web" });
  if (!res.ok) return Response.json({ error: res.error }, { status: 409 });
  const r = res.reservation;
  return Response.json({ code: r.code, date: r.date, time: r.time, partySize: r.partySize, name: r.name });
}
