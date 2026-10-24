"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { RESTAURANT } from "@/content/restaurant";
import { EmberField } from "./ember-field";
import { useSite } from "./providers";

function useCountdown(iso: string) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const target = new Date(iso).getTime();
    const tick = () => setLeft(Math.max(0, target - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [iso]);
  return left;
}

/**
 * Opening sequence (one pinned stage):
 *  1. Embers + arch window playing the official Ventura film, title rises.
 *  2. On scroll the arch opens into a full-bleed, defocused film plate.
 *  3. The manifesto lights up word by word over it.
 */
export function Hero() {
  const { t, ready, lang } = useSite();
  const stage = useRef<HTMLElement>(null);
  const left = useCountdown(RESTAURANT.openingDate);
  const introRef = useRef<gsap.core.Timeline | null>(null);
  const readyRef = useRef(ready);
  const introDone = useRef(false);

  const opening = new Date(RESTAURANT.openingDate);
  const openingLabel = opening.toLocaleDateString(lang === "es" ? "es-BO" : "en-GB", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/La_Paz" });

  useGSAP(
    () => {
      const q = gsap.utils.selector(stage);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const film = q("[data-film]")[0] as HTMLElement;
      const archBox = q("[data-arch]")[0] as HTMLElement;

      // Arch geometry (px) as a clip-path on the full-bleed film layer
      const archInset = () => {
        const r = archBox.getBoundingClientRect();
        const s = film.getBoundingClientRect();
        return { top: r.top - s.top, right: s.right - r.right, bottom: s.bottom - r.bottom, left: r.left - s.left, radius: r.width / 2 };
      };
      const state = { p: 0, reveal: reduce || introDone.current ? 1 : 0 };
      const paint = () => {
        const a = archInset();
        const k = 1 - state.p;
        const top = a.top * k + (a.bottom + (archBox.offsetHeight)) * (1 - state.reveal) * k;
        film.style.clipPath = `inset(${top}px ${a.right * k}px ${a.bottom * k}px ${a.left * k}px round ${a.radius * k}px ${a.radius * k}px 0 0)`;
      };
      paint();
      window.addEventListener("resize", paint);

      const split1 = SplitText.create(q("[data-l1]"), { type: "chars", mask: "chars" });
      const split2 = SplitText.create(q("[data-l2]"), { type: "chars", mask: "chars" });
      const words = SplitText.create(q("[data-manifesto]"), { type: "words" });

      if (!reduce && !introDone.current) {
        const intro = gsap.timeline({ delay: 0.15, paused: !readyRef.current, onComplete: () => void (introDone.current = true) });
        introRef.current = intro;
        intro
          .to(state, { reveal: 1, duration: 1.8, ease: "expo.inOut", onUpdate: paint })
          .from(split1.chars, { yPercent: 115, duration: 1.3, stagger: 0.035, ease: "expo.out" }, 0.55)
          .from(split2.chars, { yPercent: 115, duration: 1.3, stagger: 0.035, ease: "expo.out" }, 0.75)
          .from(q("[data-fade]"), { opacity: 0, y: 24, duration: 1.2, stagger: 0.08, ease: "expo.out" }, 1.1);
      }

      gsap.set(words.words, { opacity: 0.12 });

      const mm = gsap.matchMedia();
      mm.add({ desktop: "(min-width: 768px)", mobile: "(max-width: 767px)" }, (ctx) => {
        const spread = ctx.conditions?.desktop ? 32 : 16;
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: stage.current, start: "top top", end: "+=260%", scrub: 1, pin: true, anticipatePin: 1 },
        });
        tl.to(state, { p: 1, duration: 1, ease: "power2.inOut", onUpdate: paint }, 0)
          .to(q("[data-l1]"), { xPercent: -spread, opacity: 0, duration: 0.8 }, 0)
          .to(q("[data-l2]"), { xPercent: spread, opacity: 0, duration: 0.8 }, 0)
          .to(q("[data-fade]"), { opacity: 0, y: -30, duration: 0.4 }, 0)
          .to(q("[data-video]"), { filter: "blur(10px) saturate(1.1)", scale: 1.08, duration: 1 }, 0.3)
          .to(q("[data-shade]"), { opacity: 0.78, duration: 0.9 }, 0.3)
          .to(q("[data-mwrap]"), { opacity: 1, duration: 0.15 }, 1.0)
          .fromTo(q("[data-mlabel]"), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3 }, 1.05)
          .to(words.words, { opacity: 1, stagger: 0.04, duration: 0.2 }, 1.15)
          .to({}, { duration: 0.4 });
      });

      return () => {
        window.removeEventListener("resize", paint);
        mm.revert();
      };
    },
    { scope: stage, dependencies: [lang], revertOnUpdate: true },
  );

  useEffect(() => {
    readyRef.current = ready;
    if (ready) introRef.current?.play();
  }, [ready]);

  const parts = left === null ? null : [Math.floor(left / 864e5), Math.floor(left / 36e5) % 24, Math.floor(left / 6e4) % 60, Math.floor(left / 1e3) % 60];

  return (
    <section id="top" ref={stage} className="relative h-[100svh] overflow-hidden bg-ink">
      <EmberField className="absolute inset-0" />

      {/* Full-bleed film layer, clipped to the arch until scroll opens it */}
      <div data-film className="absolute inset-0 z-10 overflow-hidden" style={{ clipPath: "inset(100% 50% 0 50%)" }}>
        <video
          data-video
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/media/poster.webp"
          aria-label="Picanha asándose en la espada — Fogo de Chão Ventura Mall"
        >
          <source src="/media/rodizio.webm" type="video/webm" />
          <source src="/media/rodizio.mp4" type="video/mp4" />
        </video>
        <div data-shade className="absolute inset-0 bg-ink opacity-10" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/70 to-transparent" />
      </div>

      {/* Layout ghost that defines where the arch sits */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center pt-10">
        <div data-arch className="aspect-[3/4.4] w-[min(64vw,330px)] md:w-[min(26vw,380px)]" />
      </div>
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-[11] aspect-[3/4.4] w-[min(64vw,330px)] -translate-x-1/2 -translate-y-1/2 translate-y-[calc(-50%+20px)] md:w-[min(26vw,380px)]">
        <div data-fade className="arch absolute -inset-3 border border-gold/25" />
      </div>

      {/* Title */}
      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-[var(--gutter)] pt-10 text-center">
        <h1 className="display w-full text-[clamp(3.3rem,10.5vw,11.5rem)] text-bone">
          <span key={`l1-${lang}`} data-l1 className="block -translate-x-[6%] md:-translate-x-[14%]">
            {t.hero.line1}
          </span>
          <span key={`l2-${lang}`} data-l2 className="block translate-x-[6%] italic text-gold-soft [text-shadow:0_0_40px_rgba(229,86,42,.35)] md:translate-x-[16%]">
            {t.hero.line2}
          </span>
        </h1>
      </div>

      <div className="absolute inset-x-0 top-[96px] z-20 flex justify-center px-6">
        <p data-fade className="eyebrow text-center">
          {t.hero.eyebrow}
        </p>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-6 px-[var(--gutter)] pb-8 md:pb-10">
        <div data-fade className="max-w-[300px]">
          <p className="mb-4 hidden text-sm leading-relaxed text-bone/70 md:block">{t.hero.sub}</p>
          <p className="eyebrow mb-2 !text-[0.62rem] !text-ash">
            {t.hero.opening} · {openingLabel}
          </p>
          {parts && left! > 0 ? (
            <div className="flex gap-4 tabular-nums" aria-live="off">
              {parts.map((v, i) => (
                <div key={i} className="text-center">
                  <div className="display text-3xl text-bone md:text-4xl">{String(v).padStart(2, "0")}</div>
                  <div className="text-[0.58rem] uppercase tracking-[0.2em] text-ash">{[t.hero.days, t.hero.hours, t.hero.mins, t.hero.secs][i]}</div>
                </div>
              ))}
            </div>
          ) : parts ? (
            <p className="display text-3xl italic text-gold">{t.hero.open}</p>
          ) : null}
        </div>
        <div data-fade className="flex flex-col items-center gap-3 text-[0.62rem] uppercase tracking-[0.3em] text-ash">
          <span className="[writing-mode:vertical-rl]">{t.hero.scroll}</span>
          <span className="relative h-14 w-px overflow-hidden bg-bone/15">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollcue_2s_ease-in-out_infinite] bg-gold" />
          </span>
        </div>
      </div>

      {/* Manifesto, revealed over the opened film */}
      <div data-mwrap className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-[var(--gutter)] opacity-0">
        <div className="max-w-[1150px] text-center">
          <p data-mlabel className="eyebrow mb-8 opacity-0">
            {t.manifesto.label}
          </p>
          <p key={`m-${lang}`} data-manifesto className="display text-[clamp(1.75rem,4.1vw,4.2rem)] leading-[1.08] text-bone">
            {t.manifesto.text}
          </p>
        </div>
      </div>
      <style>{`@keyframes scrollcue{0%{transform:translateY(-100%)}100%{transform:translateY(200%)}}`}</style>
    </section>
  );
}
