import { availability } from "@/lib/reservations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get("date") ?? "";
  const party = Number(url.searchParams.get("party") ?? "2");
  const res = await availability(date, party);
  if (!res.ok) return Response.json({ error: res.error }, { status: 400 });
  return Response.json({ date: res.date, slots: res.slots });
}
