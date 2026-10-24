"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useSite } from "./providers";

type Booking = { code: string; date: string; time: string; partySize: number; name: string; status: string };
type Bubble =
  | { role: "user" | "assistant"; text: string }
  | { role: "booking"; action: "created" | "modified" | "cancelled" | "found"; booking: Booking };

const STORE = "sofia-v1";

export function Sofia() {
  const { t, lang } = useSite();
  const [open, setOpen] = useState(false);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [history, setHistory] = useState<unknown[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [working, setWorking] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef(history);
  historyRef.current = history;

  // Restore the conversation for this tab
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE) || "null");
      if (saved) {
        setBubbles(saved.bubbles ?? []);
        setHistory(saved.history ?? []);
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORE, JSON.stringify({ bubbles, history }));
    } catch {}
  }, [bubbles, history]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [bubbles, working]);

  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    if (open) {
      gsap.set(el, { display: "flex" });
      gsap.fromTo(el, { opacity: 0, y: 30, scale: 0.94, transformOrigin: "100% 100%" }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "expo.out" });
      setTimeout(() => inputRef.current?.focus(), 250);
    } else {
      gsap.to(el, { opacity: 0, y: 20, scale: 0.96, duration: 0.35, ease: "power3.in", onComplete: () => void gsap.set(el, { display: "none" }) });
    }
  }, [open]);

  const send = useCallback(
    async (text: string) => {
      const msg = text.trim();
      if (!msg || busy) return;
      setInput("");
      setBusy(true);
      setWorking(true);
      setBubbles((b) => [...b, { role: "user", text: msg }, { role: "assistant", text: "" }]);

      const appendText = (s: string) =>
        setBubbles((b) => {
          const copy = [...b];
          for (let i = copy.length - 1; i >= 0; i--) {
            const x = copy[i];
            if (x.role === "assistant") {
              copy[i] = { ...x, text: x.text + s };
              break;
            }
          }
          return copy;
        });
      const newAssistantBubble = () =>
        setBubbles((b) => (b[b.length - 1]?.role === "assistant" && !(b[b.length - 1] as { text: string }).text ? b : [...b, { role: "assistant", text: "" }]));

      try {
        const res = await fetch("/api/sofia", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: msg, lang, history: historyRef.current }),
        });
        if (!res.ok || !res.body) {
          appendText(res.status === 503 ? t.sofia.offline : res.status === 429 ? "…" : t.sofia.offline);
          return;
        }
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const events = buf.split("\n\n");
          buf = events.pop() ?? "";
          for (const ev of events) {
            if (!ev.startsWith("data: ")) continue;
            const data = JSON.parse(ev.slice(6));
            if (data.type === "text") {
              setWorking(false);
              appendText(data.text);
            } else if (data.type === "working") {
              setWorking(true);
              newAssistantBubble();
            } else if (data.type === "reservation") {
              const r = data.reservation;
              setBubbles((b) => [
                ...b.filter((x, i) => !(i === b.length - 1 && x.role === "assistant" && !x.text)),
                { role: "booking", action: data.action, booking: { code: r.code, date: r.date, time: r.time, partySize: r.partySize, name: r.name, status: r.status } },
                { role: "assistant", text: "" },
              ]);
            } else if (data.type === "history") {
              setHistory(data.history);
            } else if (data.type === "error") {
              appendText(t.sofia.offline);
            }
          }
        }
      } catch {
        appendText(t.sofia.offline);
      } finally {
        setBusy(false);
        setWorking(false);
        setBubbles((b) => b.filter((x) => !(x.role === "assistant" && !x.text)));
      }
    },
    [busy, lang, t.sofia.offline],
  );

  // Other parts of the site can open Sofía with a prefilled request
  useEffect(() => {
    const onOpen = (e: Event) => {
      setOpen(true);
      const detail = (e as CustomEvent<string | undefined>).detail;
      if (detail) setTimeout(() => send(detail), 500);
    };
    window.addEventListener("sofia:open", onOpen);
    return () => window.removeEventListener("sofia:open", onOpen);
  }, [send]);

  const reset = () => {
    setBubbles([]);
    setHistory([]);
  };

  const fmtDate = (d: string) =>
    new Date(`${d}T12:00:00`).toLocaleDateString(lang === "es" ? "es-BO" : "en-GB", { weekday: "short", day: "numeric", month: "short" });

  const actionLabel = (a: string) =>
    ({
      created: t.sofia.booked,
      modified: lang === "es" ? "Reserva actualizada" : "Reservation updated",
      cancelled: lang === "es" ? "Reserva cancelada" : "Reservation cancelled",
      found: lang === "es" ? "Tu reserva" : "Your reservation",
    })[a];

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="sofia-panel"
        className={`group fixed bottom-5 right-5 z-[60] flex items-center gap-3 rounded-full border border-gold/30 bg-coal/90 py-2 pl-2 pr-2 shadow-[0_20px_60px_-10px_rgba(229,86,42,.45)] backdrop-blur-xl transition-all duration-500 hover:border-gold/70 md:bottom-8 md:right-8 md:pr-5 ${open ? "pointer-events-none scale-90 opacity-0" : ""}`}
      >
        <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-gold-soft via-gold to-ember text-ink">
          <span className="font-display text-xl italic">S</span>
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-coal bg-go" />
          <span className="absolute inset-0 animate-ping rounded-full bg-ember/30 [animation-duration:3s]" />
        </span>
        <span className="hidden text-left md:block">
          <span className="block text-[0.7rem] uppercase tracking-[0.22em] text-bone">{t.sofia.open}</span>
          <span className="block text-[0.7rem] text-ash">{lang === "es" ? "Reservas 24/7" : "Bookings 24/7"}</span>
        </span>
      </button>

      <div
        id="sofia-panel"
        ref={panel}
        role="dialog"
        aria-label={t.sofia.title}
        data-lenis-prevent
        className="fixed inset-0 z-[70] hidden flex-col overflow-hidden bg-coal/95 backdrop-blur-2xl sm:inset-auto sm:bottom-8 sm:right-8 sm:h-[min(680px,calc(100svh-64px))] sm:w-[410px] sm:rounded-[28px] sm:border sm:border-gold/20 sm:shadow-[0_40px_120px_-20px_rgba(0,0,0,.8)]"
      >
        <header className="relative flex items-center gap-3 border-b border-bone/10 px-5 py-4">
          <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(80%_100%_at_20%_0%,rgba(229,86,42,.25),transparent)]" />
          <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-gold-soft via-gold to-ember text-ink">
            <span className="font-display text-xl italic">S</span>
          </span>
          <div className="relative flex-1">
            <p className="font-display text-2xl leading-none text-bone">{t.sofia.title}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[0.7rem] text-ash">
              <span className="h-1.5 w-1.5 rounded-full bg-go" /> {t.sofia.role}
            </p>
          </div>
          {bubbles.length > 0 && (
            <button onClick={reset} disabled={busy} className="relative rounded-full px-2 py-1 text-[0.65rem] uppercase tracking-[0.15em] text-ash hover:text-bone" title={t.sofia.reset}>
              ↺
            </button>
          )}
          <button onClick={() => setOpen(false)} aria-label="Cerrar" className="relative flex h-9 w-9 items-center justify-center rounded-full border border-bone/15 text-bone/80 hover:border-gold hover:text-bone">
            ✕
          </button>
        </header>

        <div ref={scroller} className="no-scrollbar flex-1 space-y-3 overflow-y-auto px-5 py-5" aria-live="polite">
          <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-smoke/80 px-4 py-3 text-[0.92rem] leading-relaxed text-bone/90">{t.sofia.greeting}</div>
          {bubbles.length === 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {t.sofia.chips.map((c) => (
                <button key={c} onClick={() => send(c)} className="rounded-full border border-gold/30 px-3.5 py-2 text-[0.8rem] text-bone/85 transition-colors hover:border-gold hover:bg-gold/10">
                  {c}
                </button>
              ))}
            </div>
          )}
          {bubbles.map((b, i) =>
            b.role === "booking" ? (
              <div key={i} className="overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-smoke to-coal">
                <div className={`px-4 py-2 text-[0.65rem] uppercase tracking-[0.22em] ${b.action === "cancelled" ? "bg-stop/30 text-bone" : "bg-gold/15 text-gold"}`}>{actionLabel(b.action)}</div>
                <div className="grid grid-cols-3 gap-2 px-4 py-4 text-center">
                  <div>
                    <p className="text-[0.6rem] uppercase tracking-[0.18em] text-ash">{t.reserve.date}</p>
                    <p className="mt-1 text-sm capitalize text-bone">{fmtDate(b.booking.date)}</p>
                  </div>
                  <div>
                    <p className="text-[0.6rem] uppercase tracking-[0.18em] text-ash">{t.reserve.time}</p>
                    <p className="mt-1 text-sm tabular-nums text-bone">{b.booking.time}</p>
                  </div>
                  <div>
                    <p className="text-[0.6rem] uppercase tracking-[0.18em] text-ash">{t.reserve.guests}</p>
                    <p className="mt-1 text-sm text-bone">{b.booking.partySize}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-bone/10 px-4 py-3">
                  <span className="text-xs text-ash">{b.booking.name}</span>
                  <span className="font-display text-xl tracking-wider text-gold">{b.booking.code}</span>
                </div>
              </div>
            ) : b.text ? (
              <div
                key={i}
                className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[0.92rem] leading-relaxed ${
                  b.role === "user" ? "ml-auto rounded-tr-sm bg-gold text-ink" : "rounded-tl-sm bg-smoke/80 text-bone/90"
                }`}
              >
                {b.text}
              </div>
            ) : null,
          )}
          {working && (
            <div className="flex w-fit items-center gap-1.5 rounded-2xl rounded-tl-sm bg-smoke/80 px-4 py-4" aria-label={t.sofia.typing}>
              {[0, 1, 2].map((d) => (
                <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold" style={{ animationDelay: `${d * 0.15}s` }} />
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="border-t border-bone/10 p-3"
        >
          <div className="flex items-end gap-2 rounded-2xl border border-bone/15 bg-ink/60 p-2 focus-within:border-gold/60">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              maxLength={1500}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder={t.sofia.placeholder}
              className="max-h-28 flex-1 resize-none bg-transparent px-2 py-2 text-[0.92rem] text-bone placeholder:text-ash/70 focus:outline-none focus-visible:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Enviar"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-ember text-ink transition-opacity disabled:opacity-30"
            >
              ↑
            </button>
          </div>
          <p className="px-2 pt-2 text-center text-[0.62rem] text-ash/70">{t.sofia.disclaimer}</p>
        </form>
      </div>
    </>
  );
}
