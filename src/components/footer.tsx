"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { RESTAURANT } from "@/content/restaurant";
import { useSite } from "./providers";

export function Footer() {
  const { t } = useSite();
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      gsap.fromTo(
        root.current!.querySelector("[data-big]"),
        { yPercent: 60, opacity: 0.2 },
        { yPercent: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom bottom", scrub: true } },
      );
    },
    { scope: root },
  );
  return (
    <footer ref={root} className="relative overflow-hidden border-t border-gold/10 bg-ink pt-20">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-10 px-[var(--gutter)] md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <p className="text-sm text-bone/70">{t.footer.tagline}</p>
          <p className="mt-2 text-sm text-ash">{RESTAURANT.address.es}</p>
        </div>
        <div className="flex gap-12 text-sm">
          <div>
            <p className="eyebrow mb-4 !text-ash">{t.footer.follow}</p>
            <a href={RESTAURANT.instagram} target="_blank" rel="noreferrer" className="text-bone/85 hover:text-gold">Instagram ↗</a>
          </div>
        </div>
      </div>
      <div className="mt-16 overflow-hidden px-[var(--gutter)]">
        <img data-big src="/brand/fogo-logo-gold.png" alt="Fogo de Chão" className="mx-auto w-full max-w-[1500px]" />
      </div>
      <div className="mx-auto flex max-w-[1600px] flex-col justify-between gap-2 px-[var(--gutter)] py-8 text-xs text-ash md:flex-row">
        <span>© {new Date().getFullYear()} Fogo de Chão · Ventura Mall. {t.footer.rights}</span>
        <span>Santa Cruz de la Sierra · Bolivia</span>
      </div>
    </footer>
  );
}
