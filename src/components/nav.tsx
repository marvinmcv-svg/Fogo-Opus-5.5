"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useScrollTo, useSite } from "./providers";
import { Magnetic } from "./magnetic";

export function Nav() {
  const { t, lang, setLang, ready } = useSite();
  const go = useScrollTo();
  const bar = useRef<HTMLElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  openRef.current = open;

  const links = [
    ["#ritual", t.nav.ritual],
    ["#cortes", t.nav.cuts],
    ["#mesa", t.nav.table],
    ["#bar", t.nav.bar],
    ["#ventura", t.nav.visit],
  ] as const;

  useGSAP(() => {
    if (!ready) return;
    gsap.fromTo(bar.current, { yPercent: -120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.2, ease: "expo.out", delay: 0.6 });
    // Hide on scroll down, show on scroll up; gain a backdrop once past the hero.
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate(self) {
        const past = self.scroll() > window.innerHeight * 0.6;
        bar.current?.classList.toggle("nav-solid", past);
        if (openRef.current) return;
        gsap.to(bar.current, { yPercent: self.direction === 1 && past ? -120 : 0, duration: 0.5, ease: "power3.out", overwrite: "auto" });
      },
    });
  }, [ready]);

  useEffect(() => {
    const m = menu.current;
    if (!m) return;
    if (open) {
      gsap.set(m, { display: "flex" });
      gsap.fromTo(m, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.9, ease: "expo.inOut" });
      gsap.fromTo(m.querySelectorAll("[data-ml]"), { yPercent: 120 }, { yPercent: 0, duration: 1, stagger: 0.06, ease: "expo.out", delay: 0.35 });
    } else {
      gsap.to(m, { clipPath: "inset(0 0 100% 0)", duration: 0.7, ease: "expo.inOut", onComplete: () => void gsap.set(m, { display: "none" }) });
    }
  }, [open]);

  const nav = (href: string) => {
    setOpen(false);
    go(href);
  };

  return (
    <>
      <header
        ref={bar}
        className="fixed inset-x-0 top-0 z-50 opacity-0 transition-[background-color,backdrop-filter,border-color] duration-500 [&.nav-solid]:border-b [&.nav-solid]:border-gold/10 [&.nav-solid]:bg-ink/70 [&.nav-solid]:backdrop-blur-xl"
      >
        <div className="mx-auto flex h-[72px] max-w-[1600px] items-center justify-between px-[var(--gutter)]">
          <a href="#top" onClick={(e) => (e.preventDefault(), nav("#top"))} aria-label="Fogo de Chão — inicio" className="shrink-0">
            <img src="/brand/fogo-logo-gold.png" alt="Fogo de Chão" className="h-[18px] w-auto md:h-5" />
          </a>
          <nav className="hidden items-center gap-9 lg:flex" aria-label="Principal">
            {links.map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={(e) => (e.preventDefault(), nav(href))}
                className="group relative text-[0.78rem] uppercase tracking-[0.22em] text-bone/80 transition-colors hover:text-bone"
              >
                {label}
                <span className="absolute -bottom-1.5 left-0 h-px w-full origin-right scale-x-0 bg-gold transition-transform duration-500 ease-[var(--ease-expo)] group-hover:origin-left group-hover:scale-x-100" />
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3 md:gap-5">
            <div className="flex items-center rounded-full border border-bone/15 p-0.5 text-[0.68rem] tracking-[0.18em]" role="group" aria-label="Idioma / Language">
              {(["es", "en"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={`rounded-full px-2.5 py-1 uppercase transition-colors ${lang === l ? "bg-bone text-ink" : "text-bone/60 hover:text-bone"}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <Magnetic className="hidden sm:inline-block">
              <a
                href="#reservar"
                onClick={(e) => (e.preventDefault(), nav("#reservar"))}
                className="btn-ember inline-flex items-center gap-2 rounded-full border border-gold/60 px-5 py-2.5 text-[0.72rem] uppercase tracking-[0.22em] text-bone transition-colors hover:border-flame"
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-flame" />
                {t.nav.reserve}
              </a>
            </Magnetic>
            <button
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label="Menú"
              className="relative flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
            >
              <span className={`h-px w-6 bg-bone transition-transform duration-500 ${open ? "translate-y-[3.5px] rotate-45" : ""}`} />
              <span className={`h-px w-6 bg-bone transition-transform duration-500 ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      <div ref={menu} className="fixed inset-0 z-40 hidden flex-col justify-end bg-coal px-[var(--gutter)] pb-14 pt-28 lg:hidden" style={{ clipPath: "inset(0 0 100% 0)" }}>
        <nav className="flex flex-col gap-2" aria-label="Móvil">
          {[...links, ["#reservar", t.nav.reserve] as const].map(([href, label], i) => (
            <div key={href} className="overflow-hidden">
              <a data-ml href={href} onClick={(e) => (e.preventDefault(), nav(href))} className="display flex items-baseline gap-4 text-[clamp(2.6rem,12vw,4.5rem)] text-bone">
                <span className="font-sans text-xs tracking-[0.2em] text-gold">0{i + 1}</span>
                {label}
              </a>
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}
