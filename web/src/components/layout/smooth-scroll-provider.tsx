"use client";

import { useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { SCROLL_OFFSET } from "@/data/navigation";

gsap.registerPlugin(ScrollTrigger);

type ScrollTarget = string | number | HTMLElement;

interface SmoothScrollApi {
  /** Smooth-scrolls to a selector, element or Y position. */
  scrollTo: (target: ScrollTarget, offset?: number) => void;
  stop: () => void;
  start: () => void;
}

const SmoothScrollContext = createContext<SmoothScrollApi | null>(null);

export function useSmoothScroll(): SmoothScrollApi {
  const ctx = useContext(SmoothScrollContext);
  if (!ctx) throw new Error("useSmoothScroll must be used inside SmoothScrollProvider");
  return ctx;
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;

    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenisRef.current = lenis;

    // Keep ScrollTrigger in sync and let GSAP's ticker drive Lenis.
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reduceMotion]);

  const scrollTo = useCallback(
    (target: ScrollTarget, offset: number = SCROLL_OFFSET) => {
      const lenis = lenisRef.current;
      if (lenis) {
        lenis.scrollTo(target, { offset, force: true });
        return;
      }
      // Native fallback (reduced motion, or Lenis not ready).
      let top: number;
      if (typeof target === "number") {
        top = target + offset;
      } else {
        const el = typeof target === "string" ? document.querySelector(target) : target;
        if (!el) return;
        top = el.getBoundingClientRect().top + window.scrollY + offset;
      }
      window.scrollTo({
        top: Math.max(0, top),
        behavior: reduceMotion ? "auto" : "smooth",
      });
    },
    [reduceMotion],
  );

  const stop = useCallback(() => lenisRef.current?.stop(), []);
  const start = useCallback(() => lenisRef.current?.start(), []);

  const value = useMemo(() => ({ scrollTo, stop, start }), [scrollTo, stop, start]);

  return <SmoothScrollContext value={value}>{children}</SmoothScrollContext>;
}
