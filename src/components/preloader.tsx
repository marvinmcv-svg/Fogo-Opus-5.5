"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useSite } from "./providers";

const PRELOAD = ["/media/poster.webp", "/media/stills/fire.webp", ...Array.from({ length: 12 }, (_, i) => `/media/seq/${String(i + 1).padStart(3, "0")}.webp`)];

export function Preloader() {
  const { t, setReady } = useSite();
  const root = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let loaded = 0;
    const total = PRELOAD.length + 1;
    const progress = { v: 0 };
    const target = { v: 0 };
    const bump = () => {
      loaded++;
      target.v = loaded / total;
    };
    PRELOAD.forEach((src) => {
      const img = new Image();
      img.onload = img.onerror = bump;
      img.src = src;
    });
    document.fonts.ready.then(bump);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const started = performance.now();
    const minMs = reduce ? 200 : 2200;
    let raf = 0;
    const loop = () => {
      const timeCap = Math.min(1, (performance.now() - started) / minMs);
      const goal = Math.min(target.v, timeCap);
      // Ease toward the goal but always make visible progress, even at low frame rates
      progress.v = Math.min(goal, progress.v + Math.max((goal - progress.v) * 0.12, 0.004));
      setN(Math.round(progress.v * 100));
      if (progress.v >= 1) finish();
      else raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    // Never hold the visitor hostage on a slow connection
    const bail = setTimeout(() => (target.v = 1), 6000);

    let done = false;
    function finish() {
      if (done) return;
      done = true;
      setN(100);
      const el = root.current!;
      const tl = gsap.timeline({ onComplete: () => setGone(true) });
      tl.to(el.querySelector("[data-pl-inner]"), { opacity: 0, y: -30, duration: 0.6, ease: "power3.in" })
        .add(() => setReady(true), "-=0.1")
        .to(el.querySelector("[data-pl-top]"), { yPercent: -100, duration: 1.2, ease: "expo.inOut" }, "<")
        .to(el.querySelector("[data-pl-bottom]"), { yPercent: 100, duration: 1.2, ease: "expo.inOut" }, "<");
    }
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(bail);
    };
  }, [setReady]);

  if (gone) return null;
  return (
    <div ref={root} className="fixed inset-0 z-[95]" aria-live="polite" aria-label={t.loader}>
      <div data-pl-top className="absolute inset-x-0 top-0 h-1/2 bg-ink" />
      <div data-pl-bottom className="absolute inset-x-0 bottom-0 h-1/2 bg-ink" />
      <div data-pl-inner className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-6">
        <div className="relative w-[min(78vw,520px)]">
          <img src="/brand/fogo-logo-gold.png" alt="" className="w-full opacity-15" />
          <img
            src="/brand/fogo-logo-gold.png"
            alt="Fogo de Chão"
            className="absolute inset-0 w-full"
            style={{ clipPath: `inset(0 ${100 - n}% 0 0)` }}
          />
          <div
            className="absolute -bottom-3 left-0 h-px bg-gradient-to-r from-transparent via-flame to-gold"
            style={{ width: `${n}%`, boxShadow: "0 0 18px 2px rgba(255,138,61,.6)" }}
          />
        </div>
        <div className="flex w-[min(78vw,520px)] items-center justify-between text-[0.7rem] uppercase tracking-[0.3em] text-ash">
          <span>{t.loader}</span>
          <span className="tabular-nums text-gold">{String(n).padStart(3, "0")}</span>
        </div>
      </div>
    </div>
  );
}
