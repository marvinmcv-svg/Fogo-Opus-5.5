"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { CUTS } from "@/content/restaurant";
import { useSite } from "./providers";
import { Reveal } from "./reveal";

const MOMENTS = ["grill", "picanha", "carving", "salt"];

/**
 * Menu of cuts. On desktop a sticky arch cycles through four real moments
 * from the grill as the list scrolls past; each row draws its rule and rises.
 */
export function Cuts() {
  const { t, lang } = useSite();
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      q("[data-row]").forEach((row) => {
        gsap.from(row.querySelector("[data-rule]"), { scaleX: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: row, start: "top 88%", once: true } });
        gsap.from(row.querySelectorAll("[data-rise]"), {
          yPercent: 60,
          opacity: 0,
          duration: 1.1,
          stagger: 0.07,
          ease: "expo.out",
          scrollTrigger: { trigger: row, start: "top 85%", once: true },
        });
      });

      const imgs = q("[data-moment]");
      const labels = q("[data-mlabel]");
      ScrollTrigger.create({
        trigger: q("[data-list]")[0],
        start: "top 60%",
        end: "bottom 60%",
        onUpdate(self) {
          const idx = Math.min(MOMENTS.length - 1, Math.floor(self.progress * MOMENTS.length));
          imgs.forEach((img, i) => gsap.to(img, { opacity: i === idx ? 1 : 0, scale: i === idx ? 1 : 1.12, duration: 1.1, ease: "power3.out", overwrite: "auto" }));
          labels.forEach((l, i) => gsap.to(l, { yPercent: (i - idx) * 100, duration: 0.8, ease: "expo.out", overwrite: "auto" }));
        },
      });
      gsap.to(q("[data-sticky-img]"), {
        yPercent: -8,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true },
      });
    },
    { scope: root, dependencies: [lang], revertOnUpdate: true },
  );

  return (
    <section id="cortes" ref={root} className="relative bg-ink py-28 md:py-40">
      <div className="mx-auto max-w-[1600px] px-[var(--gutter)]">
        <div className="mb-16 flex flex-col gap-6 md:mb-24 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-6">{t.cuts.label}</p>
            <Reveal as="h2" className="display text-[clamp(3rem,7.5vw,8rem)] text-bone">
              {t.cuts.title} <em className="gold-text">{t.cuts.titleEm}</em>
            </Reveal>
          </div>
          <p className="max-w-xs text-sm text-ash">{t.cuts.note}</p>
        </div>

        <div className="grid gap-12 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-20">
          <div className="hidden md:block">
            <div className="sticky top-[14vh]">
              <div data-sticky-img className="arch relative aspect-[3/4.2] w-full overflow-hidden">
                {MOMENTS.map((m, i) => (
                  <img
                    key={m}
                    data-moment
                    src={`/media/stills/${m}.webp`}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ opacity: i === 0 ? 1 : 0 }}
                  />
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 h-6 overflow-hidden">
                  {t.cuts.moments.map((m, i) => (
                    <span key={m} data-mlabel className="eyebrow absolute left-0 top-0 block whitespace-nowrap" style={{ transform: `translateY(${i * 100}%)` }}>
                      0{i + 1} — {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <ol data-list className="relative">
            {CUTS.map((c, i) => (
              <li key={c.pt} data-row className="group relative py-8 md:py-10">
                <div data-rule className="absolute inset-x-0 top-0 h-px origin-left bg-bone/15" />
                <div className="flex items-baseline gap-5 md:gap-8">
                  <span data-rise className="w-8 shrink-0 font-sans text-xs tracking-[0.2em] text-gold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
                      <h3 data-rise className="display text-[clamp(2.4rem,5vw,5.2rem)] text-bone">
                        <span className="inline-block transition-[color,transform] duration-700 ease-[var(--ease-expo)] group-hover:translate-x-3 group-hover:text-gold-soft">{c.pt}</span>
                      </h3>
                      <span data-rise className="font-display text-xl italic text-ash md:text-2xl">
                        {c.name[lang]}
                      </span>
                    </div>
                    <p data-rise className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-bone/65">
                      {c.desc[lang]}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
