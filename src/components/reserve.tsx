"use client";

import { useEffect, useMemo, useState } from "react";
import { BOOKING, RESTAURANT } from "@/content/restaurant";
import { useSite } from "./providers";
import { Reveal } from "./reveal";

type Slot = { time: string; service: "lunch" | "dinner" };

/** First bookable date: today in La Paz, or opening day if we haven't opened yet. */
function firstBookableDate() {
  const laPaz = (ms: number) => new Date(ms - 4 * 3600_000).toISOString().slice(0, 10);
  const today = laPaz(Date.now());
  const opening = laPaz(new Date(RESTAURANT.openingDate).getTime());
  return today > opening ? today : opening;
}

const field =
  "w-full rounded-none border-0 border-b border-bone/20 bg-transparent px-0 py-3 text-bone placeholder:text-ash/60 transition-colors focus:border-gold focus:outline-none focus:ring-0";

export function Reserve() {
  const { t, lang } = useSite();
  const [date, setDate] = useState("");
  const [party, setParty] = useState(2);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", occasion: "", notes: "", website: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ code: string; date: string; time: string; partySize: number } | null>(null);

  const min = useMemo(firstBookableDate, []);
  useEffect(() => setDate((d) => d || min), [min]);

  useEffect(() => {
    if (!date) return;
    const ctrl = new AbortController();
    setLoading(true);
    setTime("");
    fetch(`/api/reservations/availability?date=${date}&party=${party}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [date, party]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!time) return;
    setStatus("sending");
    setError("");
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        email: form.email || undefined,
        occasion: form.occasion && form.occasion !== t.reserve.occasions[0] ? form.occasion : undefined,
        notes: form.notes || undefined,
        website: form.website || undefined,
        date,
        time,
        partySize: party,
      }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    if (!res?.ok) {
      setStatus("error");
      setError(data?.error ?? t.reserve.error);
      return;
    }
    setDone(data);
    setStatus("idle");
  };

  const fmtDate = (d: string) =>
    new Date(`${d}T12:00:00`).toLocaleDateString(lang === "es" ? "es-BO" : "en-GB", { weekday: "long", day: "numeric", month: "long" });

  const grouped = (["lunch", "dinner"] as const).map((s) => [s, (slots ?? []).filter((x) => x.service === s)] as const);

  return (
    <section id="reservar" className="relative overflow-hidden bg-ink py-28 md:py-40">
      <div className="absolute inset-0 bg-[radial-gradient(70%_50%_at_80%_0%,rgba(210,168,102,.10),transparent_60%)]" />
      <div className="relative mx-auto grid max-w-[1400px] gap-16 px-[var(--gutter)] md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-24">
        <div>
          <p className="eyebrow mb-6">{t.reserve.label}</p>
          <Reveal as="h2" className="display text-[clamp(3rem,6.5vw,7rem)] text-bone">
            {t.reserve.title} <em className="gold-text">{t.reserve.titleEm}</em>
          </Reveal>
          <p className="mt-8 max-w-sm leading-relaxed text-bone/70">{t.reserve.intro}</p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("sofia:open", { detail: lang === "es" ? "Quiero reservar una mesa" : "I'd like to book a table" }))}
            className="mt-10 inline-flex items-center gap-4 text-left"
          >
            <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gold to-ember text-ink">
              <span className="font-display text-xl italic">S</span>
              <span className="absolute inset-0 animate-ping rounded-full bg-ember/40 [animation-duration:2.4s]" />
            </span>
            <span>
              <span className="block text-sm uppercase tracking-[0.2em] text-bone">{t.reserve.askSofia}</span>
              <span className="block text-sm text-ash">{t.sofia.role}</span>
            </span>
          </button>
        </div>

        <div className="rounded-3xl border border-gold/15 bg-char/80 p-6 backdrop-blur md:p-12">
          {done ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-gold text-2xl text-gold">✓</div>
              <h3 className="display text-5xl text-bone">{t.reserve.success}</h3>
              <p className="mt-6 text-lg capitalize text-bone/80">
                {fmtDate(done.date)} · {done.time} · {done.partySize} {t.reserve.guests.toLowerCase()}
              </p>
              <p className="mt-6 text-sm uppercase tracking-[0.25em] text-ash">{t.reserve.code}</p>
              <p className="display mt-2 text-4xl tracking-wider text-gold">{done.code}</p>
              <button onClick={() => (setDone(null), setTime(""))} className="mt-10 text-xs uppercase tracking-[0.25em] text-bone/70 underline-offset-8 hover:text-bone hover:underline">
                {t.reserve.again}
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-8">
              <div className="grid gap-8 sm:grid-cols-2">
                <label className="block">
                  <span className="eyebrow !text-ash">{t.reserve.date}</span>
                  <input type="date" required min={min} value={date} onChange={(e) => setDate(e.target.value)} className={field} />
                </label>
                <div>
                  <span className="eyebrow !text-ash">{t.reserve.guests}</span>
                  <div className="mt-2 flex items-center justify-between border-b border-bone/20 py-2">
                    <button type="button" aria-label="−" onClick={() => setParty((p) => Math.max(1, p - 1))} className="h-9 w-9 rounded-full border border-bone/20 text-lg hover:border-gold">−</button>
                    <span className="display text-3xl tabular-nums" aria-live="polite">{party}</span>
                    <button type="button" aria-label="+" onClick={() => setParty((p) => Math.min(BOOKING.maxPartyOnline, p + 1))} className="h-9 w-9 rounded-full border border-bone/20 text-lg hover:border-gold">+</button>
                  </div>
                </div>
              </div>

              <fieldset>
                <legend className="eyebrow mb-4 !text-ash">{loading ? t.reserve.checking : t.reserve.pickTime}</legend>
                {slots && slots.length === 0 && !loading ? (
                  <p className="text-sm text-bone/70">{t.reserve.noSlots}</p>
                ) : (
                  <div className={`space-y-4 transition-opacity ${loading ? "opacity-40" : ""}`}>
                    {grouped.map(([s, list]) =>
                      list.length ? (
                        <div key={s} className="flex flex-wrap gap-2">
                          {list.map((x) => (
                            <button
                              key={x.time}
                              type="button"
                              aria-pressed={time === x.time}
                              onClick={() => setTime(x.time)}
                              className={`rounded-full border px-4 py-2 text-sm tabular-nums transition-colors ${time === x.time ? "border-gold bg-gold text-ink" : "border-bone/15 text-bone/80 hover:border-gold/60"}`}
                            >
                              {x.time}
                            </button>
                          ))}
                        </div>
                      ) : null,
                    )}
                  </div>
                )}
              </fieldset>

              <div className="grid gap-8 sm:grid-cols-2">
                <label className="block">
                  <span className="eyebrow !text-ash">{t.reserve.name}</span>
                  <input required minLength={2} autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
                </label>
                <label className="block">
                  <span className="eyebrow !text-ash">{t.reserve.phone}</span>
                  <input required type="tel" autoComplete="tel" minLength={7} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={field} placeholder="+591" />
                </label>
                <label className="block">
                  <span className="eyebrow !text-ash">{t.reserve.email}</span>
                  <input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} />
                </label>
                <label className="block">
                  <span className="eyebrow !text-ash">{t.reserve.occasion}</span>
                  <select value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })} className={`${field} bg-char`}>
                    {t.reserve.occasions.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="eyebrow !text-ash">{t.reserve.notes}</span>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={`${field} resize-none`} />
              </label>
              <input tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />

              {status === "error" && <p role="alert" className="text-sm text-flame">{error}</p>}
              <button
                type="submit"
                disabled={!time || status === "sending"}
                className="btn-ember w-full rounded-full border border-gold/70 py-5 text-xs uppercase tracking-[0.3em] text-bone transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              >
                {status === "sending" ? "…" : t.reserve.submit}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
