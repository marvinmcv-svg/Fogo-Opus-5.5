"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { useSite } from "./providers";

type Props = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** lines: masked line rise · chars: staggered letters · words: soft blur-in */
  type?: "lines" | "chars" | "words";
  delay?: number;
  /** Start immediately instead of waiting for the element to scroll in */
  immediate?: boolean;
  start?: string;
};

/**
 * Scroll-triggered text reveal built on GSAP SplitText.
 * `autoSplit` re-splits on resize / font load so line breaks stay correct.
 */
export function Reveal({ as: Tag = "div", children, className, type = "lines", delay = 0, immediate, start = "top 85%" }: Props) {
  const ref = useRef<HTMLElement>(null);
  const { lang } = useSite();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      SplitText.create(el, {
        type: type === "chars" ? "lines,chars" : type === "words" ? "lines,words" : "lines",
        mask: type === "words" ? undefined : "lines",
        linesClass: "split-line",
        autoSplit: true,
        onSplit(self) {
          const targets = type === "chars" ? self.chars : type === "words" ? self.words : self.lines;
          const from =
            type === "words"
              ? { opacity: 0, y: 18, filter: "blur(8px)" }
              : { yPercent: 110, rotate: type === "chars" ? 4 : 2, opacity: type === "chars" ? 0 : 1 };
          return gsap.from(targets, {
            ...from,
            duration: type === "chars" ? 1.1 : 1.25,
            ease: "expo.out",
            stagger: type === "chars" ? 0.028 : type === "words" ? 0.03 : 0.11,
            delay,
            scrollTrigger: immediate ? undefined : { trigger: el, start, once: true },
          });
        },
      });
    },
    { scope: ref, dependencies: [lang], revertOnUpdate: true },
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
