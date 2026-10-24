"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { HOURS, HOURS_LABEL, RESTAURANT } from "@/content/restaurant";
import { useSite } from "./providers";
import { Reveal } from "./reveal";

export function Visit() {
  const { t, lang } = useSite();
  const root = useRef<HTMLElement>(null);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(RESTAURANT.mapsQuery)}`;
  const embed = `https://www.google.com/maps?q=${encodeURIComponent(RESTAURANT.mapsQuery)}&z=16&output=embed`;

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      gsap.fromTo(
        q("[data-map]"),
        { clipPath: "inset(18% 18% 18% 18% round 32px)" },
        { clipPath: "inset(0% 0% 0% 0% round 24px)", ease: "none", scrollTrigger: { trigger: q("[data-map]")[0], start: "top 95%", end: "top 35%", scrub: true } },
      );
      gsap.from(q("[data-info] > *"), { y: 40, opacity: 0, stagger: 0.1, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: q("[data-info]")[0], start: "top 85%", once: true } });
    },
    { scope: root, dependencies: [lang], revertOnUpdate: true },
  );

  const contact = [RESTAURANT.phone, RESTAURANT.whatsapp && `WhatsApp ${RESTAURANT.whatsapp}`, RESTAURANT.email].filter(Boolean) as string[];

  return (
    <section id="ventura" ref={root} className="relative bg-char py-28 md:py-40">
      <div className="mx-auto grid max-w-[1600px] gap-14 px-[var(--gutter)] md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-20">
        <div data-info className="flex flex-col gap-10">
          <div>
            <p className="eyebrow mb-6">{t.visit.label}</p>
            <Reveal as="h2" className="display text-[clamp(3rem,6.5vw,7rem)] text-bone">
              {t.visit.title} <em className="gold-text">{t.visit.titleEm}</em>
            </Reveal>
          </div>
          <div className="hairline" />
          <dl className="grid gap-8 sm:grid-cols-2">
            <div>
              <dt className="eyebrow mb-3 !text-ash">{t.visit.address}</dt>
              <dd className="leading-relaxed text-bone/85">{RESTAURANT.address[lang]}</dd>
            </div>
            <div>
              <dt className="eyebrow mb-3 !text-ash">{t.visit.hours}</dt>
              <dd className="space-y-1 text-bone/85">
                <p className="text-sm text-ash">{t.visit.daily}</p>
                {HOURS.map((h) => (
                  <p key={h.service}>
                    {HOURS_LABEL[h.service][lang]} · <span className="tabular-nums">{h.open} – {h.close}</span>
                  </p>
                ))}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="eyebrow mb-3 !text-ash">{t.visit.contact}</dt>
              <dd className="space-y-1 text-bone/85">
                {contact.length ? contact.map((c) => <p key={c}>{c}</p>) : <p className="italic text-ash">{t.visit.soon}</p>}
                <a href={RESTAURANT.instagram} target="_blank" rel="noreferrer" className="inline-block text-gold transition-colors hover:text-gold-soft">
                  {RESTAURANT.instagramHandle} ↗
                </a>
              </dd>
            </div>
          </dl>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-ember inline-flex w-fit items-center gap-3 rounded-full border border-gold/60 px-7 py-4 text-xs uppercase tracking-[0.24em] text-bone"
          >
            {t.visit.directions} <span aria-hidden>↗</span>
          </a>
        </div>

        <div data-map className="relative min-h-[420px] overflow-hidden rounded-3xl md:min-h-[640px]">
          <iframe
            title="Mapa — Ventura Mall"
            src={embed}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full border-0 [filter:grayscale(1)_invert(.92)_sepia(.35)_hue-rotate(345deg)_contrast(.9)]"
          />
          <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-gold/20" />
        </div>
      </div>
    </section>
  );
}
