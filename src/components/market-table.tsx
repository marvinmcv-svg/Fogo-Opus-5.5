"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { DESSERTS, MARKET_TABLE } from "@/content/restaurant";
import { useSite } from "./providers";
import { Reveal } from "./reveal";

/** A parchment "printed menu" interlude — the one light room in a house of fire. */
export function MarketTable() {
  const { t, lang } = useSite();
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      // The section rises as an arch and flattens into a full page
      gsap.fromTo(
        q("[data-sheet]"),
        { clipPath: "inset(0% 6% 0% 6% round 48vw 48vw 0 0)" },
        {
          clipPath: "inset(0% 0% 0% 0% round 0vw 0vw 0 0)",
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "top 15%", scrub: true },
        },
      );
      q("[data-col]").forEach((col) => {
        gsap.from(col.querySelectorAll("li, h3"), {
          y: 30,
          opacity: 0,
          duration: 1,
          stagger: 0.06,
          ease: "expo.out",
          scrollTrigger: { trigger: col, start: "top 82%", once: true },
        });
      });
    },
    { scope: root, dependencies: [lang], revertOnUpdate: true },
  );

  return (
    <section id="mesa" ref={root} className="relative bg-ink">
      <div data-sheet className="relative bg-parchment px-[var(--gutter)] py-28 text-ink md:py-40">
        <div className="mx-auto max-w-[1400px]">
          <div className="mx-auto mb-20 max-w-3xl text-center">
            <p className="eyebrow mb-6 !text-[#8a5a24]">{t.table.label}</p>
            <Reveal as="h2" className="display text-[clamp(3rem,7vw,7.5rem)]">
              {t.table.title} <em className="text-[#9a3a17]">{t.table.titleEm}</em>
            </Reveal>
            <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-ink/70 md:text-lg">{t.table.intro}</p>
          </div>

          <div className="grid gap-14 md:grid-cols-3 md:gap-10">
            {MARKET_TABLE.map((g) => (
              <div key={g.group.es} data-col>
                <h3 className="mb-6 border-b border-ink/20 pb-4 font-display text-3xl italic">{g.group[lang]}</h3>
                <ul className="space-y-4">
                  {g.items.map((it) => (
                    <li key={it.es} className="flex items-baseline gap-3 text-[1.05rem]">
                      <span className="text-[#9a3a17]">✦</span>
                      {it[lang]}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div data-col className="mt-24 border-t border-ink/20 pt-12 text-center">
            <h3 className="eyebrow mb-8 !text-[#8a5a24]">{t.table.desserts}</h3>
            <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 font-display text-[clamp(1.4rem,2.4vw,2.2rem)] italic">
              {DESSERTS.map((d, i) => (
                <li key={d.es} className="flex items-center gap-10">
                  {i > 0 && <span className="hidden text-base not-italic text-[#9a3a17] md:inline">·</span>}
                  {d[lang]}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
