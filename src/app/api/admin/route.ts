import { timingSafeEqual } from "crypto";
import { z } from "zod";
import { readAll, setStatus } from "@/lib/reservations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: Request) {
  const expected = process.env.ADMIN_PASSWORD;
  const given = req.headers.get("x-admin-password") ?? "";
  if (!expected || given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

export async function GET(req: Request) {
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json(await readAll());
}

const Patch = z.object({ code: z.string(), status: z.enum(["confirmed", "cancelled", "seated", "no_show"]) });

export async function PATCH(req: Request) {
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });
  const res = await setStatus(parsed.data.code, parsed.data.status);
  return res.ok ? Response.json(res.reservation) : Response.json({ error: res.error }, { status: 404 });
}
