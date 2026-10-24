"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useSite } from "./providers";

const FRAMES = 112;
const src = (i: number) => `/media/seq/${String(i + 1).padStart(3, "0")}.webp`;

/**
 * Scroll-scrubbed film: the Ventura Mall ad decoded into 112 stills and painted
 * to a canvas frame-by-frame as the visitor scrolls. A blurred copy of the
 * same frame washes the background so the portrait film fills any screen.
 */
export function FilmSequence() {
  const { t, lang } = useSite();
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const ambient = useRef<HTMLCanvasElement>(null);
  const images = useRef<HTMLImageElement[]>([]);
  const current = useRef(0);

  const draw = (i: number) => {
    const c = canvas.current;
    const a = ambient.current;
    // Fall back to the nearest frame that has already decoded
    let img: HTMLImageElement | undefined;
    for (let k = i; k >= 0; k--) {
      const cand = images.current[k];
      if (cand?.complete && cand.naturalWidth) {
        img = cand;
        break;
      }
    }
    if (!c || !img) return;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0, c.width, c.height);
    if (a) a.getContext("2d")!.drawImage(img, 0, 0, a.width, a.height);
  };

  // Load frames only when the section approaches the viewport
  useEffect(() => {
    const el = section.current!;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        for (let i = 0; i < FRAMES; i++) {
          const img = new Image();
          img.decoding = "async";
          img.src = src(i);
          if (i === 0 || i === current.current) img.onload = () => draw(current.current);
          images.current[i] = img;
        }
      },
      { rootMargin: "200% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useGSAP(
    () => {
      const q = gsap.utils.selector(section);
      const caps = q("[data-cap]");
      const obj = { f: 0 };
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: "+=420%",
          scrub: 0.6,
          pin: true,
          anticipatePin: 1,
        },
      });
      tl.to(obj, {
        f: FRAMES - 1,
        duration: 10,
        onUpdate() {
          const i = Math.round(obj.f);
          if (i !== current.current) {
            current.current = i;
            draw(i);
          }
        },
      }, 0);
      tl.fromTo(q("[data-frame]"), { scale: 0.86, borderRadius: 220 }, { scale: 1, borderRadius: 24, duration: 1.4, ease: "power2.out" }, 0);
      tl.to(q("[data-bar]"), { scaleX: 1, duration: 10 }, 0);
      caps.forEach((cap, i) => {
        const at = 0.6 + i * 1.9;
        tl.fromTo(cap, { opacity: 0, y: 60, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.5, ease: "power2.out" }, at);
        if (i < caps.length - 1) tl.to(cap, { opacity: 0, y: -60, filter: "blur(10px)", duration: 0.45, ease: "power2.in" }, at + 1.4);
      });
    },
    { scope: section, dependencies: [lang], revertOnUpdate: true },
  );

  return (
    <section ref={section} className="relative h-[100svh] overflow-hidden bg-ink" aria-label="Film">
      <canvas ref={ambient} width={54} height={96} aria-hidden className="absolute inset-0 h-full w-full scale-125 opacity-55 blur-3xl saturate-150" />
      <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_50%,transparent,rgba(11,8,6,.92))]" />

      <div className="relative z-10 flex h-full items-center justify-center">
        <div data-frame className="relative aspect-[9/16] h-[78svh] overflow-hidden shadow-[0_40px_120px_-20px_rgba(229,86,42,.35)] md:h-[86svh]">
          <canvas ref={canvas} width={540} height={960} className="h-full w-full" role="img" aria-label="Picanha en la espada, cortada y servida por un gaúcho" />
          <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-gold/20" />
        </div>
      </div>

      {/* Captions alternate sides on desktop, sit under the frame on mobile */}
      <div className="pointer-events-none absolute inset-0 z-20">
        {t.film.captions.map((c, i) => (
          <div
            key={c.k}
            data-cap
            className={`absolute bottom-[9svh] left-[var(--gutter)] right-[var(--gutter)] text-center opacity-0 md:bottom-auto md:top-1/2 md:w-[28vw] md:-translate-y-1/2 md:text-left ${
              i % 2 ? "md:left-auto md:right-[var(--gutter)] md:text-right" : "md:right-auto"
            }`}
          >
            <p className="eyebrow mb-3">{c.k} / 05</p>
            <h3 className="display text-[clamp(2.6rem,5.4vw,6rem)] text-bone [text-shadow:0_4px_40px_rgba(0,0,0,.6)]">{c.t}</h3>
            <p className="mt-3 text-sm text-bone/70 md:text-base">{c.s}</p>
          </div>
        ))}
      </div>

      <div className="absolute left-1/2 bottom-6 z-20 hidden h-px w-40 -translate-x-1/2 -translate-y-1/2 bg-bone/15 md:block">
        <div data-bar className="h-full w-full origin-left scale-x-0 bg-gold" />
      </div>
    </section>
  );
}
