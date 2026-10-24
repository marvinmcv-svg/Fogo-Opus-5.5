"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { RESTAURANT } from "@/content/restaurant";
import { useSite } from "./providers";
import { Reveal } from "./reveal";

const ROW_A = ["picanha", "fire", "salt", "carving", "gaucho"];
const ROW_B = ["crust", "grill", "hanging", "picanha", "fire"];
const ALT: Record<string, string> = {
  picanha: "Picanha en la espada",
  fire: "Parrilla encendida",
  salt: "Sal gruesa sobre picanha cruda",
  carving: "Corte en la mesa",
  gaucho: "Gaúcho sirviendo",
  crust: "Costra dorada de la picanha",
  grill: "Carne sobre las brasas",
  hanging: "Corte colgando junto al fuego",
};

/** Two counter-drifting rows of real moments, tied to scroll position. */
export function Gallery() {
  const { t, lang } = useSite();
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const st = { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.6 };
      gsap.fromTo(q("[data-row-a]"), { xPercent: 4 }, { xPercent: -28, ease: "none", scrollTrigger: st });
      gsap.fromTo(q("[data-row-b]"), { xPercent: -30 }, { xPercent: 2, ease: "none", scrollTrigger: st });
      q("[data-g-img]").forEach((img) =>
        gsap.fromTo(img, { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: img, start: "top bottom", end: "bottom top", scrub: true } }),
      );
    },
    { scope: root, dependencies: [lang], revertOnUpdate: true },
  );

  const tile = (s: string, i: number, tall: boolean) => (
    <figure key={`${s}-${i}`} className={`relative shrink-0 overflow-hidden rounded-[20px] ${tall ? "h-[56vw] w-[40vw] md:h-[34vw] md:w-[24vw]" : "h-[44vw] w-[34vw] md:h-[26vw] md:w-[19vw]"}`}>
      <img data-g-img src={`/media/stills/${s}.webp`} alt={ALT[s]} loading="lazy" className="h-full w-full object-cover" />
    </figure>
  );

  return (
    <section ref={root} className="relative overflow-hidden bg-ink py-28 md:py-40" aria-label={t.gallery.title}>
      <div className="mx-auto mb-14 flex max-w-[1600px] items-end justify-between gap-6 px-[var(--gutter)] md:mb-20">
        <div>
          <p className="eyebrow mb-6">{t.gallery.label}</p>
          <Reveal as="h2" className="display text-[clamp(3rem,7vw,7.5rem)] text-bone">
            {t.gallery.title}
          </Reveal>
        </div>
        <a href={RESTAURANT.instagram} target="_blank" rel="noreferrer" className="eyebrow shrink-0 border-b border-gold/40 pb-1 transition-colors hover:text-bone">
          {RESTAURANT.instagramHandle} ↗
        </a>
      </div>
      <div className="space-y-4 md:space-y-6">
        <div data-row-a className="flex items-end gap-4 md:gap-6">{ROW_A.map((s, i) => tile(s, i, i % 2 === 0))}</div>
        <div data-row-b className="flex items-start gap-4 md:gap-6">{ROW_B.map((s, i) => tile(s, i, i % 2 === 1))}</div>
      </div>
    </section>
  );
}
