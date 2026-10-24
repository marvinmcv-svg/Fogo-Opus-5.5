"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useSite } from "./providers";
import { Reveal } from "./reveal";

const STILLS = ["fire", "carving", "hanging", "gaucho"];

/**
 * Horizontal, pinned walk through the four beats of the rodizio. The
 * two-sided card (green / red) flips in 3D as the visitor reaches each beat.
 */
export function Ritual() {
  const { t, lang } = useSite();
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const track = q("[data-track]")[0] as HTMLElement;
      const distance = () => track.scrollWidth - window.innerWidth;

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: () => `+=${distance()}`,
          scrub: 0.8,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
      tl.to(track, { x: () => -distance(), duration: 4 }, 0)
        // card: green → green (beat 2) → red (beat 3) → green (beat 4)
        .to(q("[data-coin]"), { rotateY: 180, duration: 0.5, ease: "power2.inOut" }, 2.1)
        .to(q("[data-coin]"), { rotateY: 360, duration: 0.5, ease: "power2.inOut" }, 3.1)
        .to(q("[data-progress]"), { scaleX: 1, duration: 4 }, 0);

      // Parallax inside each image + subtle tilt of each panel as it passes
      q("[data-panel]").forEach((panel) => {
        const img = panel.querySelector("img");
        if (img) {
          gsap.fromTo(img, { xPercent: -12 }, {
            xPercent: 12,
            ease: "none",
            scrollTrigger: { trigger: panel, containerAnimation: tl, start: "left right", end: "right left", scrub: true },
          });
        }
      });
    },
    { scope: root, dependencies: [lang], revertOnUpdate: true },
  );

  return (
    <section id="ritual" ref={root} className="relative h-[100svh] overflow-hidden bg-char">
      <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_100%,rgba(229,86,42,.14),transparent_60%)]" />

      {/* The card */}
      <div className="pointer-events-none absolute bottom-8 left-[var(--gutter)] z-20 [perspective:900px] md:bottom-12">
        <div data-coin className="relative h-24 w-24 [transform-style:preserve-3d] md:h-32 md:w-32">
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-go text-center shadow-[0_0_60px_-5px_rgba(63,154,95,.7)] [backface-visibility:hidden]">
            <span className="px-3 text-[0.6rem] font-semibold uppercase leading-tight tracking-[0.18em] text-bone md:text-[0.7rem]">{t.ritual.green}</span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-stop text-center shadow-[0_0_60px_-5px_rgba(184,50,42,.7)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <span className="px-3 text-[0.6rem] font-semibold uppercase leading-tight tracking-[0.18em] text-bone md:text-[0.7rem]">{t.ritual.red}</span>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-[var(--gutter)] top-[92px] z-20 h-px bg-bone/10">
        <div data-progress className="h-full origin-left scale-x-0 bg-gold" />
      </div>

      <div data-track className="relative flex h-full w-max items-center gap-[6vw] pl-[var(--gutter)] pr-[20vw]">
        <div className="w-[86vw] shrink-0 md:w-[44vw]">
          <p className="eyebrow mb-6">{t.ritual.label}</p>
          <Reveal as="h2" className="display text-[clamp(3rem,7vw,7.5rem)] text-bone">
            {t.ritual.title} <em className="gold-text">{t.ritual.titleEm}</em>
          </Reveal>
        </div>

        {t.ritual.steps.map((s, i) => (
          <article data-panel key={s.n} className="flex w-[82vw] shrink-0 flex-col gap-6 md:w-[62vw] md:flex-row md:items-end md:gap-10">
            <div className="arch relative aspect-[3/4] w-[52vw] shrink-0 overflow-hidden md:w-[22vw]">
              <img src={`/media/stills/${STILLS[i]}.webp`} alt="" loading="lazy" className="absolute inset-0 h-full w-[124%] max-w-none -translate-x-[10%] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
            </div>
            <div className="max-w-md pb-2">
              <span className="display block text-[clamp(4.5rem,9vw,9rem)] leading-none text-gold/25">{s.n}</span>
              <h3 className="display -mt-4 text-[clamp(2.2rem,4vw,4rem)] text-bone">
                {i === 1 ? <span className="text-go">{s.t}</span> : i === 2 ? <span className="text-stop">{s.t}</span> : s.t}
              </h3>
              <p className="mt-4 text-base leading-relaxed text-bone/70 md:text-lg">{s.d}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
