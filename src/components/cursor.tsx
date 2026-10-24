"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Two-part cursor: a precise dot and a lagging ring that swells over
 * interactive elements. Elements with data-cursor="Label" show that label.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const d = dot.current!;
    const r = ring.current!;
    gsap.set([d, r], { xPercent: -50, yPercent: -50, opacity: 1 });
    const dx = gsap.quickTo(d, "x", { duration: 0.08 });
    const dy = gsap.quickTo(d, "y", { duration: 0.08 });
    const rx = gsap.quickTo(r, "x", { duration: 0.5, ease: "power3.out" });
    const ry = gsap.quickTo(r, "y", { duration: 0.5, ease: "power3.out" });

    const move = (e: PointerEvent) => {
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
    };
    const over = (e: PointerEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>("a, button, [data-cursor], input, select, textarea, label");
      const text = target?.dataset.cursor;
      if (label.current) label.current.textContent = text ?? "";
      gsap.to(r, {
        scale: text ? 3.2 : target ? 1.8 : 1,
        backgroundColor: text ? "rgba(210,168,102,0.92)" : "rgba(210,168,102,0)",
        borderColor: target ? "rgba(210,168,102,0.9)" : "rgba(243,234,219,0.45)",
        duration: 0.45,
        ease: "power3.out",
      });
      gsap.to(d, { scale: target ? 0 : 1, duration: 0.3 });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerover", over);
    document.documentElement.classList.add("has-cursor");
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
    };
  }, []);

  return (
    <>
      <div ref={dot} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[100] h-1.5 w-1.5 rounded-full bg-gold opacity-0 mix-blend-difference" />
      <div
        ref={ring}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[99] flex h-9 w-9 items-center justify-center rounded-full border border-bone/45 opacity-0"
      >
        <span ref={label} className="text-[5px] font-semibold uppercase tracking-[0.2em] text-ink" />
      </div>
    </>
  );
}
