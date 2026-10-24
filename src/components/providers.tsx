"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";
import { COPY, type Copy } from "@/content/copy";
import type { Lang } from "@/content/restaurant";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

interface Ctx {
  lang: Lang;
  t: Copy;
  setLang: (l: Lang) => void;
  lenis: Lenis | null;
  ready: boolean;
  setReady: (v: boolean) => void;
}

const SiteContext = createContext<Ctx | null>(null);

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite must be used inside <Providers>");
  return ctx;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("fogo-lang");
      if (saved === "en" || saved === "es") setLangState(saved);
      else if (navigator.language.startsWith("en")) setLangState("en");
    } catch {}
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    document.documentElement.lang = l;
    try {
      localStorage.setItem("fogo-lang", l);
    } catch {}
    requestAnimationFrame(() => ScrollTrigger.refresh());
  };

  // Lenis smooth scroll driven by GSAP's ticker so ScrollTrigger stays in sync.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const l = new Lenis({ lerp: 0.085, wheelMultiplier: 1, touchMultiplier: 1.4 });
    l.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => l.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    setLenis(l);
    return () => {
      gsap.ticker.remove(tick);
      l.destroy();
    };
  }, []);

  useEffect(() => {
    if (!lenis) return;
    if (ready) lenis.start();
    else lenis.stop();
  }, [lenis, ready]);

  const value = useMemo(() => ({ lang, t: COPY[lang] as Copy, setLang, lenis, ready, setReady }), [lang, lenis, ready]);
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

/** Smoothly scroll to an anchor, through Lenis when available. */
export function useScrollTo() {
  const { lenis } = useSite();
  return (target: string) => {
    const el = document.querySelector(target);
    if (!el) return;
    if (lenis) lenis.scrollTo(el as HTMLElement, { duration: 1.6, offset: 0 });
    else el.scrollIntoView({ behavior: "smooth" });
  };
}
