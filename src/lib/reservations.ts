import "server-only";
import { randomBytes } from "crypto";
import { BOOKING, HOURS, RESTAURANT } from "@/content/restaurant";
import { readDoc, StaleWriteError, writeDoc } from "./store";

/**
 * Reservation engine (storage lives in ./store: Vercel Blob or a local file).
 *
 * Bolivia has no daylight saving (UTC-4 all year), so every date/time here is
 * restaurant-local wall time ("YYYY-MM-DD", "HH:MM").
 */

export type Status = "confirmed" | "cancelled" | "seated" | "no_show";

export interface Reservation {
  code: string;
  name: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  partySize: number;
  occasion?: string;
  notes?: string;
  status: Status;
  source: "web" | "sofia";
  createdAt: string;
  updatedAt: string;
}

export interface WaitlistEntry {
  id: string;
  name: string;
  phone: string;
  date: string;
  preferredTime?: string;
  partySize: number;
  createdAt: string;
}

export interface Lead {
  id: string;
  kind: "private_event" | "callback";
  name: string;
  phone?: string;
  email?: string;
  date?: string;
  guests?: number;
  details: string;
  createdAt: string;
}

interface DB {
  reservations: Reservation[];
  waitlist: WaitlistEntry[];
  leads: Lead[];
}

const UTC_OFFSET_MIN = -4 * 60;

let queue: Promise<unknown> = Promise.resolve();

function normalise(data: Partial<DB> | null): DB {
  return { reservations: data?.reservations ?? [], waitlist: data?.waitlist ?? [], leads: data?.leads ?? [] };
}

async function load(): Promise<DB> {
  return normalise((await readDoc<Partial<DB>>()).data);
}

/**
 * Read-modify-write with optimistic concurrency. Calls are queued within this
 * instance, and the store rejects a write whose source changed underneath it
 * (another instance booked first), in which case we re-run on fresh data.
 * Results with `ok: false` change nothing and skip the write.
 */
function mutate<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    for (let attempt = 0; ; attempt++) {
      const snap = await readDoc<Partial<DB>>();
      const db = normalise(snap.data);
      const out = await fn(db);
      if ((out as { ok?: boolean })?.ok === false) return out;
      try {
        await writeDoc(db, snap.version);
        return out;
      } catch (err) {
        if (err instanceof StaleWriteError && attempt < 5) continue;
        throw err;
      }
    }
  });
  queue = run.catch(() => undefined);
  return run;
}

export async function readAll(): Promise<DB> {
  await queue;
  return load();
}

// ---------- time helpers ----------

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const toHHMM = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export function localNow() {
  const d = new Date(Date.now() + UTC_OFFSET_MIN * 60_000);
  const date = d.toISOString().slice(0, 10);
  return { date, minutes: d.getUTCHours() * 60 + d.getUTCMinutes(), iso: `${date} ${toHHMM(d.getUTCHours() * 60 + d.getUTCMinutes())}` };
}

function dayOfWeek(date: string) {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Opening night in restaurant-local wall time; nothing is bookable before it. */
const OPENING = (() => {
  const d = new Date(new Date(RESTAURANT.openingDate).getTime() + UTC_OFFSET_MIN * 60_000);
  return { date: d.toISOString().slice(0, 10), minutes: d.getUTCHours() * 60 + d.getUTCMinutes() };
})();
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Every bookable slot for a date, ignoring capacity. */
function allSlots(date: string) {
  const dow = dayOfWeek(date);
  const out: { time: string; service: "lunch" | "dinner" }[] = [];
  for (const h of HOURS) {
    if (!(h.days as readonly number[]).includes(dow)) continue;
    const last = toMin(h.close) - BOOKING.lastSeatingBeforeCloseMinutes;
    for (let m = toMin(h.open); m <= last; m += BOOKING.slotMinutes) out.push({ time: toHHMM(m), service: h.service });
  }
  return out;
}

function coversAround(db: DB, date: string, time: string, ignoreCode?: string) {
  const t = toMin(time);
  return db.reservations
    .filter((r) => r.date === date && r.status === "confirmed" && r.code !== ignoreCode)
    .filter((r) => Math.abs(toMin(r.time) - t) < BOOKING.diningMinutes)
    .reduce((n, r) => n + r.partySize, 0);
}

export function validateRequest(date: string, time: string | undefined, partySize: number): string | null {
  if (!DATE_RE.test(date)) return "Invalid date format, expected YYYY-MM-DD.";
  if (time !== undefined && !TIME_RE.test(time)) return "Invalid time format, expected HH:MM (24h).";
  if (!Number.isInteger(partySize) || partySize < 1) return "Party size must be at least 1.";
  if (partySize > BOOKING.maxPartyOnline)
    return `Parties larger than ${BOOKING.maxPartyOnline} are handled by the events team (use the private event request).`;
  const now = localNow();
  if (date < now.date) return "That date is in the past.";
  if (date < OPENING.date) return `We open on ${OPENING.date} at ${toHHMM(OPENING.minutes)}; reservations start then.`;
  const max = new Date(`${now.date}T12:00:00Z`);
  max.setUTCDate(max.getUTCDate() + BOOKING.maxDaysAhead);
  if (date > max.toISOString().slice(0, 10)) return `Bookings open up to ${BOOKING.maxDaysAhead} days ahead.`;
  return null;
}

function slotIsFuture(date: string, time: string) {
  if (date === OPENING.date && toMin(time) < OPENING.minutes) return false;
  const now = localNow();
  if (date > now.date) return true;
  return date === now.date && toMin(time) >= now.minutes + BOOKING.minNoticeMinutes;
}

export async function availability(date: string, partySize: number, ignoreCode?: string) {
  const err = validateRequest(date, undefined, partySize);
  if (err) return { ok: false as const, error: err };
  const db = await readAll();
  const slots = allSlots(date)
    .filter((s) => slotIsFuture(date, s.time))
    .filter((s) => coversAround(db, date, s.time, ignoreCode) + partySize <= BOOKING.onlineCovers);
  return { ok: true as const, date, partySize, slots };
}

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(5);
  return "FV-" + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

const normPhone = (p: string) => p.replace(/[^\d]/g, "").slice(-8);

export interface CreateInput {
  name: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  partySize: number;
  occasion?: string;
  notes?: string;
  source: "web" | "sofia";
}

export async function createReservation(input: CreateInput) {
  const err = validateRequest(input.date, input.time, input.partySize);
  if (err) return { ok: false as const, error: err };
  if (input.name.trim().length < 2) return { ok: false as const, error: "A name is required." };
  if (normPhone(input.phone).length < 7) return { ok: false as const, error: "A valid phone number is required." };
  return mutate((db) => {
    const slot = allSlots(input.date).find((s) => s.time === input.time);
    if (!slot) return { ok: false as const, error: "That time is outside service hours." };
    if (!slotIsFuture(input.date, input.time)) return { ok: false as const, error: "That time has already passed or is too soon." };
    if (coversAround(db, input.date, input.time) + input.partySize > BOOKING.onlineCovers)
      return { ok: false as const, error: "That time just filled up. Please choose another." };
    const now = new Date().toISOString();
    const r: Reservation = {
      code: makeCode(),
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim() || undefined,
      date: input.date,
      time: input.time,
      partySize: input.partySize,
      occasion: input.occasion?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
      status: "confirmed",
      source: input.source,
      createdAt: now,
      updatedAt: now,
    };
    db.reservations.push(r);
    return { ok: true as const, reservation: r };
  });
}

/** Lookups require code + matching phone so guests can't read each other's bookings. */
function findIn(db: DB, code: string, phone: string) {
  const r = db.reservations.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
  if (!r || normPhone(r.phone) !== normPhone(phone)) return null;
  return r;
}

export async function findReservation(code: string, phone: string) {
  const db = await readAll();
  const r = findIn(db, code, phone);
  return r ? { ok: true as const, reservation: r } : { ok: false as const, error: "No reservation matches that code and phone." };
}

export async function modifyReservation(
  code: string,
  phone: string,
  changes: { date?: string; time?: string; partySize?: number; notes?: string; occasion?: string },
) {
  return mutate((db) => {
    const r = findIn(db, code, phone);
    if (!r) return { ok: false as const, error: "No reservation matches that code and phone." };
    if (r.status !== "confirmed") return { ok: false as const, error: `This reservation is ${r.status}.` };
    const date = changes.date ?? r.date;
    const time = changes.time ?? r.time;
    const partySize = changes.partySize ?? r.partySize;
    const err = validateRequest(date, time, partySize);
    if (err) return { ok: false as const, error: err };
    if (!allSlots(date).some((s) => s.time === time)) return { ok: false as const, error: "That time is outside service hours." };
    if (!slotIsFuture(date, time)) return { ok: false as const, error: "That time has already passed or is too soon." };
    if (coversAround(db, date, time, r.code) + partySize > BOOKING.onlineCovers)
      return { ok: false as const, error: "No room at that time. Check availability for alternatives." };
    Object.assign(r, { date, time, partySize, updatedAt: new Date().toISOString() });
    if (changes.notes !== undefined) r.notes = changes.notes;
    if (changes.occasion !== undefined) r.occasion = changes.occasion;
    return { ok: true as const, reservation: r };
  });
}

export async function cancelReservation(code: string, phone: string) {
  return mutate((db) => {
    const r = findIn(db, code, phone);
    if (!r) return { ok: false as const, error: "No reservation matches that code and phone." };
    if (r.status === "cancelled") return { ok: false as const, error: "Already cancelled." };
    r.status = "cancelled";
    r.updatedAt = new Date().toISOString();
    return { ok: true as const, reservation: r };
  });
}

export async function setStatus(code: string, status: Status) {
  return mutate((db) => {
    const r = db.reservations.find((x) => x.code === code);
    if (!r) return { ok: false as const, error: "Not found" };
    r.status = status;
    r.updatedAt = new Date().toISOString();
    return { ok: true as const, reservation: r };
  });
}

export async function joinWaitlist(e: Omit<WaitlistEntry, "id" | "createdAt">) {
  if (!DATE_RE.test(e.date)) return { ok: false as const, error: "Invalid date." };
  return mutate((db) => {
    const entry: WaitlistEntry = { ...e, id: randomBytes(4).toString("hex"), createdAt: new Date().toISOString() };
    db.waitlist.push(entry);
    return { ok: true as const, entry };
  });
}

export async function addLead(l: Omit<Lead, "id" | "createdAt">) {
  return mutate((db) => {
    const lead: Lead = { ...l, id: randomBytes(4).toString("hex"), createdAt: new Date().toISOString() };
    db.leads.push(lead);
    return { ok: true as const, lead };
  });
}
