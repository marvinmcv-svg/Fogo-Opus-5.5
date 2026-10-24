"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { BAR } from "@/content/restaurant";
import { useSite } from "./providers";
import { Reveal } from "./reveal";

/** Velocity-reactive marquee: it runs on its own and leans into your scroll. */
export function Bar() {
  const { t, lang } = useSite();
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const tracks = q("[data-marquee]");
      const loops = tracks.map((track, i) =>
        gsap.to(track, { xPercent: i % 2 ? 0 : -50, startAt: { xPercent: i % 2 ? -50 : 0 }, duration: 38, ease: "none", repeat: -1 }),
      );
      const skew = gsap.quickTo(tracks, "skewX", { duration: 0.6, ease: "power3.out" });
      let settle: gsap.core.Tween | null = null;
      ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: "bottom top",
        onUpdate(self) {
          const v = self.getVelocity();
          loops.forEach((l) => l.timeScale(1 + Math.min(Math.abs(v) / 300, 6) * (self.direction || 1)));
          skew(gsap.utils.clamp(-12, 12, v / -180));
          settle?.kill();
          settle = gsap.delayedCall(0.15, () => {
            loops.forEach((l) => gsap.to(l, { timeScale: 1, duration: 1.2, overwrite: true }));
            skew(0);
          });
        },
      });
      gsap.from(q("[data-drink]"), {
        y: 60,
        opacity: 0,
        duration: 1.2,
        stagger: 0.12,
        ease: "expo.out",
        scrollTrigger: { trigger: q("[data-drinks]")[0], start: "top 85%", once: true },
      });
    },
    { scope: root, dependencies: [lang], revertOnUpdate: true },
  );

  const words = [...t.bar.marquee, ...t.bar.marquee];
  return (
    <section id="bar" ref={root} className="relative overflow-hidden bg-ink py-28 md:py-40">
      <div className="absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_45%,rgba(229,86,42,.16),transparent_70%)]" />
      <div className="relative mx-auto mb-16 max-w-[1600px] px-[var(--gutter)] text-center md:mb-24">
        <p className="eyebrow mb-6">{t.bar.label}</p>
        <Reveal as="h2" className="display text-[clamp(3rem,7.5vw,8rem)] text-bone">
          {t.bar.title} <em className="gold-text">{t.bar.titleEm}</em>
        </Reveal>
      </div>

      <div className="relative space-y-2" aria-hidden>
        {[0, 1].map((row) => (
          <div key={row} className="overflow-hidden whitespace-nowrap">
            <div data-marquee className="marquee-track">
              {words.map((w, i) => (
                <span
                  key={i}
                  className={`display px-6 text-[clamp(3.5rem,10vw,10rem)] leading-[1.05] ${
                    (i + row) % 2 ? "italic text-transparent [-webkit-text-stroke:1px_rgba(210,168,102,.55)]" : "text-bone/90"
                  }`}
                >
                  {w} <span className="align-middle text-[0.3em] text-ember">✦</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div data-drinks className="relative mx-auto mt-20 grid max-w-[1400px] gap-px overflow-hidden rounded-2xl border border-gold/15 bg-gold/15 px-0 md:mt-28 md:grid-cols-3" style={{ marginInline: "max(var(--gutter), calc((100% - 1400px) / 2))" }}>
        {BAR.map((b, i) => (
          <div key={b.name} data-drink className="group relative bg-char p-8 transition-colors duration-700 hover:bg-coal md:p-12">
            <span className="font-sans text-xs tracking-[0.2em] text-gold">0{i + 1}</span>
            <h3 className="display mt-8 text-[clamp(2rem,3vw,3rem)] text-bone">{b.name}</h3>
            <p className="mt-4 text-bone/65">{b.desc[lang]}</p>
            <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-ember to-gold transition-transform duration-700 group-hover:scale-x-100" />
          </div>
        ))}
      </div>
    </section>
  );
}
