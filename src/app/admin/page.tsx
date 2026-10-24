"use client";

import { useCallback, useEffect, useState } from "react";

type R = { code: string; name: string; phone: string; email?: string; date: string; time: string; partySize: number; occasion?: string; notes?: string; status: string; source: string };
type DB = {
  reservations: R[];
  waitlist: { id: string; name: string; phone: string; date: string; preferredTime?: string; partySize: number }[];
  leads: { id: string; kind: string; name: string; phone?: string; email?: string; date?: string; guests?: number; details: string; createdAt: string }[];
};

const STATUSES = ["confirmed", "seated", "no_show", "cancelled"] as const;

export default function Admin() {
  const [pw, setPw] = useState("");
  const [db, setDb] = useState<DB | null>(null);
  const [err, setErr] = useState("");
  const [day, setDay] = useState(() => new Date(Date.now() - 4 * 3600_000).toISOString().slice(0, 10));

  const load = useCallback(async (password: string) => {
    const res = await fetch("/api/admin", { headers: { "x-admin-password": password } });
    if (!res.ok) {
      setErr(res.status === 401 ? "Contraseña incorrecta (o ADMIN_PASSWORD sin configurar)." : "Error");
      setDb(null);
      return;
    }
    setErr("");
    sessionStorage.setItem("fogo-admin", password);
    setDb(await res.json());
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("fogo-admin");
    if (saved) {
      setPw(saved);
      load(saved);
    }
  }, [load]);

  const update = async (code: string, status: string) => {
    await fetch("/api/admin", { method: "PATCH", headers: { "Content-Type": "application/json", "x-admin-password": pw }, body: JSON.stringify({ code, status }) });
    load(pw);
  };

  if (!db)
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink p-6 text-bone">
        <form onSubmit={(e) => (e.preventDefault(), load(pw))} className="w-full max-w-sm space-y-4">
          <img src="/brand/fogo-logo-gold.png" alt="Fogo de Chão" className="mx-auto mb-10 h-6" />
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Contraseña" className="w-full rounded-xl border border-bone/20 bg-coal px-4 py-3" />
          {err && <p className="text-sm text-flame">{err}</p>}
          <button className="w-full rounded-xl bg-gold py-3 text-ink">Entrar</button>
        </form>
      </main>
    );

  const list = db.reservations.filter((r) => r.date === day).sort((a, b) => a.time.localeCompare(b.time));
  const covers = list.filter((r) => r.status !== "cancelled").reduce((n, r) => n + r.partySize, 0);

  return (
    <main className="min-h-screen bg-ink px-4 py-10 text-bone md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <img src="/brand/fogo-logo-gold.png" alt="Fogo de Chão" className="h-5" />
          <div className="flex items-center gap-3">
            <input type="date" value={day} onChange={(e) => setDay(e.target.value)} className="rounded-lg border border-bone/20 bg-coal px-3 py-2" />
            <button onClick={() => load(pw)} className="rounded-lg border border-gold/40 px-3 py-2 text-sm">Actualizar</button>
          </div>
        </header>
        <p className="mb-4 text-sm text-ash">{list.length} reservas · {covers} cubiertos</p>
        <div className="overflow-x-auto rounded-2xl border border-bone/10">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-coal text-xs uppercase tracking-wider text-ash">
              <tr>{["Hora", "Nombre", "Pax", "Teléfono", "Ocasión / Notas", "Código", "Origen", "Estado"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.code} className="border-t border-bone/10">
                  <td className="px-4 py-3 tabular-nums">{r.time}</td>
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3">{r.partySize}</td>
                  <td className="px-4 py-3"><a className="text-gold" href={`https://wa.me/${r.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">{r.phone}</a></td>
                  <td className="px-4 py-3 text-bone/70">{[r.occasion, r.notes].filter(Boolean).join(" · ")}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.code}</td>
                  <td className="px-4 py-3 text-xs text-ash">{r.source}</td>
                  <td className="px-4 py-3">
                    <select value={r.status} onChange={(e) => update(r.code, e.target.value)} className="rounded border border-bone/20 bg-coal px-2 py-1">
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {!list.length && <tr><td colSpan={8} className="px-4 py-10 text-center text-ash">Sin reservas para este día.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <section>
            <h2 className="mb-3 font-display text-2xl">Lista de espera</h2>
            <ul className="space-y-2 text-sm">
              {db.waitlist.filter((w) => w.date >= day).map((w) => (
                <li key={w.id} className="rounded-xl border border-bone/10 p-3">{w.date} {w.preferredTime ?? ""} · {w.name} · {w.partySize} pax · {w.phone}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="mb-3 font-display text-2xl">Eventos y mensajes</h2>
            <ul className="space-y-2 text-sm">
              {[...db.leads].reverse().map((l) => (
                <li key={l.id} className="rounded-xl border border-bone/10 p-3">
                  <span className="mr-2 rounded bg-gold/15 px-2 py-0.5 text-xs text-gold">{l.kind === "private_event" ? "Evento" : "Mensaje"}</span>
                  {l.name} · {l.phone ?? l.email} {l.date ? `· ${l.date}` : ""} {l.guests ? `· ${l.guests} pax` : ""}
                  <p className="mt-1 text-bone/70">{l.details}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
